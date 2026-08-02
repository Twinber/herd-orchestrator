#!/usr/bin/env node
import { connect } from "node:net";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const [, , configPath, ...flags] = process.argv;
const PLAN_ONLY = flags.includes("--plan");
const NO_PUSH = flags.includes("--no-push");
const NO_REVIEW = flags.includes("--no-review");
const NO_CLEANUP = flags.includes("--no-cleanup");
const KEEP_BRANCH = flags.includes("--keep-branch");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const socket = config.socket;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function rpc(method, params, { timeoutMs = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const id = `f:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const sock = connect(socket);
    let buf = Buffer.alloc(0);
    let settled = false;
    const finish = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sock.destroy();
      fn(v);
    };
    const timer = setTimeout(
      () => finish(reject, new Error(`timeout ${method} after ${timeoutMs}ms`)),
      timeoutMs
    );
    sock.on("connect", () => sock.write(JSON.stringify({ id, method, params }) + "\n"));
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      let nl;
      while ((nl = buf.indexOf(10)) !== -1) {
        const line = buf.subarray(0, nl).toString("utf8");
        buf = buf.subarray(nl + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id !== id) continue;
        if (msg.error) finish(reject, new Error(msg.error.message || "rpc error"));
        else finish(resolve, msg.result);
      }
    });
    sock.on("error", (e) => finish(reject, new Error(`socket: ${e.message}`)));
  });
}

function log(step, msg) {
  process.stdout.write(`[factory][${step}] ${msg}\n`);
}

function ghToken() {
  if (config.git_token) return config.git_token;
  const credFile = join(homedir(), ".git-credentials");
  try {
    const cred = readFileSync(credFile, "utf8");
    const m = cred.match(/https:\/\/([^:]+):([^@]+)@github\.com/);
    if (m) return m[2];
  } catch {}
  return "";
}

async function agentStatus(target) {
  try {
    const info = await rpc("agent.get", { target });
    return info.agent_status;
  } catch {
    return "unknown";
  }
}

async function agentInfo(target) {
  try {
    const info = await rpc("agent.get", { target });
    return info.agent || {};
  } catch {
    return {};
  }
}

async function waitAgentReady(target, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const info = await agentInfo(target);
    if (info.interactive_ready === true && info.name) return info;
    await sleep(2000);
  }
  const info = await agentInfo(target);
  if (info.interactive_ready !== true) {
    throw new Error(`agent on ${target} never became ready`);
  }
  return info;
}

async function promptWithRetry(target, text, retries = 4) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await rpc("agent.prompt", { target, text });
    } catch (err) {
      lastErr = err;
      await sleep(2500);
    }
  }
  throw lastErr;
}

async function waitAgentIdle(target, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last = "unknown";
  while (Date.now() < deadline) {
    last = await agentStatus(target);
    if (last === "idle" || last === "done") return { status: last, timedOut: false };
    await sleep(3000);
  }
  return { status: last, timedOut: true };
}

async function readAgentOutput(target) {
  try {
    const out = await rpc("agent.read", { target, source: "recent", lines: 200, strip_ansi: true });
    return typeof out === "string" ? out : JSON.stringify(out);
  } catch {
    return "";
  }
}

// ---------- phase 1: deploy ----------
async function deploy(issue) {
  const branch = issue.branch;
  const wtPath = join(config.worktree_base, branch.replace(/\//g, "-"));
  log("deploy", `worktree.create branch=${branch} path=${wtPath}`);
  const created = await rpc("worktree.create", {
    branch,
    path: wtPath,
    cwd: config.repo.cwd,
  });
  const paneId = created.root_pane.pane_id;
  const workspaceId = created.workspace.workspace_id;

  log("deploy", `agent.start name=${issue.id} pane=${paneId}`);
  const started = await rpc("agent.start", {
    pane_id: paneId,
    name: issue.id,
    kind: issue.kind || "opencode",
    timeout_ms: config.timeouts.agent_start_ms,
  });

  const target = paneId;
  await waitAgentReady(target, config.timeouts.agent_start_ms);
  log("deploy", `agent.prompt target=${target}`);
  const prompt = [
    `Work in the current worktree on branch ${branch}.`,
    `Implement the following task in the repository.`,
    ``,
    issue.prompt,
    ``,
    `Rules:`,
    `- Commit your changes in logical micro-commits on ${branch}.`,
    `- Do NOT push. Do NOT merge. Do NOT touch the base branch.`,
    `- Run the relevant tests/lint before finishing if the repo defines them.`,
    `- When done, reply with a short summary and the exact line "TASK_COMPLETE".`,
  ].join("\n");
  await promptWithRetry(target, prompt);

  return {
    id: issue.id,
    branch,
    title: issue.title,
    prompt: issue.prompt,
    paneId,
    workspaceId,
    wtPath,
    target,
    agentName: issue.id,
  };
}

// ---------- phase 2: monitor ----------
async function monitor(task) {
  log("monitor", `wait idle target=${task.target}`);
  const res = await waitAgentIdle(task.target, config.timeouts.worker_wait_ms, task.id);
  task.workerStatus = res;
  task.output = await readAgentOutput(task.target);
  const completed = task.output.includes("TASK_COMPLETE");
  log(
    "monitor",
    `${task.id}: status=${res.status} timedOut=${res.timedOut} completed=${completed}`
  );
  if (!completed) {
    log("monitor", `--- last output of ${task.id} ---\n${task.output.slice(-1500)}\n---`);
  }
  return completed;
}

// ---------- phase 3: cross review ----------
async function review(task, allTasks, reviewers) {
  const base = config.repo.base_branch;
  const reviewerName = `rev-${task.id}`;
  const prompt = [
    `You are a code reviewer in a git worktree on branch ${task.branch}.`,
    `Review the diff of this branch against ${base} for the task:`,
    ``,
    task.prompt,
    ``,
    `Run: git diff ${base}...${task.branch} --stat`,
    `Inspect the changes carefully. Look for bugs, missing tests, integration issues, and task requirements not met.`,
    `Reply with EXACTLY one line:`,
    `APPROVE` +
      (task.reviewer_notes ? ` (note: ${task.reviewer_notes})` : "") +
      ` or CHANGES_REQUESTED: <comma separated list>`,
  ].join("\n");

  log("review", `start reviewer ${reviewerName} pane=${task.paneId}`);
  await rpc("agent.start", {
    pane_id: task.paneId,
    name: reviewerName,
    kind: "opencode",
    timeout_ms: config.timeouts.agent_start_ms,
  });
  const target = task.paneId;
  await waitAgentReady(target, config.timeouts.agent_start_ms);
  await promptWithRetry(target, prompt);

  const res = await waitAgentIdle(target, config.timeouts.review_wait_ms, reviewerName);
  const out = await readAgentOutput(target);
  const verdict = out.includes("CHANGES_REQUESTED") ? "changes" : out.includes("APPROVE") ? "approve" : "unknown";
  log("review", `${task.id} -> ${verdict} (status=${res.status})`);
  task.reviewVerdict = verdict;
  task.reviewOutput = out;
  return verdict;
}

// ---------- phase 4: integrate (merge on main) ----------
async function integrate(task) {
  const cwd = config.repo.cwd;
  const base = config.repo.base_branch;
  const branch = task.branch;
  log("integrate", `merge ${branch} into ${base}`);
  try {
    const mergeOut = git(cwd, ["merge", "--no-ff", branch, "-m", `Merge ${branch}`]);
    log("integrate", `merged ${branch}: ${mergeOut.split("\n")[0] || "ok"}`);
    return { ok: true };
  } catch (err) {
    const msg = String(err.stdout || err.message);
    log("integrate", `MERGE CONFLICT on ${branch}\n${msg.slice(0, 1200)}`);
    return { ok: false, conflict: true };
  }
}

// ---------- phase 5: push + PR ----------
async function pushAndPr(task) {
  const cwd = config.repo.cwd;
  const remote = config.repo.remote;
  const branch = task.branch;
  const ghRepo = config.repo.gh_repo;
  const token = ghToken();

  log("push", `push ${branch} to ${remote}`);
  try {
    git(cwd, ["push", remote, branch]);
  } catch (err) {
    log("push", `push failed: ${err.message}`);
    return { ok: false, error: String(err.message).slice(0, 500) };
  }

  if (!token || !ghRepo) {
    log("push", `PR skipped (no gh_repo or token)`);
    return { ok: true, prCreated: false };
  }

  const base = config.repo.base_branch;
  const body = `Automated PR by herdr factory.\n\nTask: ${task.title}\n\n${task.prompt}`;
  const payload = JSON.stringify({ title: `[factory] ${task.title}`, head: branch, base, body });
  try {
    const res = execFileSync("curl", [
      "-sS",
      "-X", "POST",
      `https://api.github.com/repos/${ghRepo}/pulls`,
      "-H", `Authorization: Bearer ${token}`,
      "-H", "Accept: application/vnd.github+json",
      "-H", "Content-Type: application/json",
      "-d", payload,
    ], { encoding: "utf8" });
    const pr = JSON.parse(res);
    if (pr.html_url) {
      log("push", `PR created: ${pr.html_url}`);
      return { ok: true, prCreated: true, prUrl: pr.html_url };
    }
    log("push", `PR create response: ${res.slice(0, 400)}`);
    return { ok: false, prCreated: false, error: res.slice(0, 400) };
  } catch (err) {
    log("push", `PR create failed: ${String(err.stdout || err.message).slice(0, 500)}`);
    return { ok: false, prCreated: false };
  }
}

// ---------- phase 6: cleanup ----------
async function cleanup(task) {
  log("cleanup", `worktree.remove workspace=${task.workspaceId}`);
  await rpc("worktree.remove", { workspace_id: task.workspaceId });
  if (!KEEP_BRANCH) {
    try {
      git(config.repo.cwd, ["branch", "-D", task.branch]);
      log("cleanup", `branch ${task.branch} deleted`);
    } catch {}
  }
}

async function main() {
  const { issues } = config;
  const started = Date.now();
  log("start", `factory: ${issues.length} issues against ${config.repo.cwd}`);
  if (PLAN_ONLY) {
    log("plan", issues.map((i) => `${i.id}: ${i.branch} <- ${i.title}`).join("\n"));
    log("plan", `flags: push=${!NO_PUSH} review=${!NO_REVIEW} cleanup=${!NO_CLEANUP}`);
    return;
  }

  // 1. deploy all in parallel
  const tasks = [];
  for (const issue of issues) {
    tasks.push(await deploy(issue));
  }
  log("deploy", `deployed ${tasks.length} workers`);

  // 2. monitor all (parallel waits)
  const completed = await Promise.all(tasks.map(monitor));
  const doneTasks = tasks.filter((_, i) => completed[i]);
  const failedTasks = tasks.filter((_, i) => !completed[i]);

  // 3. cross review (unless disabled or worker failed)
  if (!NO_REVIEW && doneTasks.length) {
    for (const task of doneTasks) {
      await review(task, doneTasks, {});
    }
  }

  // 4. integrate only approved/complete tasks (skip conflict-prone auto-merge if reviewer said changes)
  const mergeable = doneTasks.filter(
    (t) => NO_REVIEW || t.reviewVerdict !== "changes"
  );
  for (const task of mergeable) {
    await integrate(task);
  }

  // 5. push + PR
  if (!NO_PUSH) {
    for (const task of mergeable) {
      await pushAndPr(task);
    }
  } else {
    log("push", "skipped (--no-push)");
  }

  // 6. cleanup
  if (!NO_CLEANUP) {
    for (const task of tasks) {
      await cleanup(task);
    }
  }

  const dt = ((Date.now() - started) / 1000).toFixed(0);
  log(
    "done",
    `elapsed=${dt}s completed=${doneTasks.length}/${tasks.length} ` +
      `failed=${failedTasks.map((t) => t.id).join(",") || "-"}`
  );
}

main().catch((err) => {
  process.stderr.write(`[factory][fatal] ${err.stack || err}\n`);
  process.exit(1);
});
