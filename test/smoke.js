import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "server.js");

const child = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "pipe"],
});

let nextId = 0;
const pending = new Map();

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}

function request(method, params) {
  return new Promise((resolve, reject) => {
    const id = String(++nextId);
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify({ id, jsonrpc: "2.0", method, params }) + "\n");
  });
}

let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let nl;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl);
    buffer = buffer.slice(nl + 1);
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }
});

child.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

const timer = setTimeout(() => {
  if (pending.size) {
    console.error("smoke test timed out with pending requests");
    child.kill();
    process.exit(1);
  }
}, 15000);
timer.unref();

const results = {};
try {
  const init = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0.0.1" },
  });
  results.initialize = { protocol: init.protocolVersion, server: init.serverInfo };
  notify("notifications/initialized", {});

  const list = await request("tools/list", {});
  results.toolCount = list.tools.length;
  results.sampleTool = list.tools.find((t) => t.name === "herdr_pane_split")?.inputSchema;

  const tabClose = list.tools.find((t) => t.name === "herdr_tab_close");
  results.tabCloseDescription = tabClose?.description;
  results.tabCloseFieldDocs = Object.fromEntries(
    Object.entries(tabClose?.inputSchema?.properties || {}).map(([k, v]) => [k, v.description])
  );

  const paneList = await request("tools/call", {
    name: "herdr_pane_list",
    arguments: {},
  });
  results.paneListOk = paneList.isError ? false : true;
  results.paneListSnippet = (paneList.content?.[0]?.text || "").slice(0, 160);

  const bad = await request("tools/call", {
    name: "herdr_pane_list",
    arguments: { workspace_id: "w1" },
  });
  results.paneListWithWsOk = bad.isError ? false : true;
} catch (err) {
  results.error = String(err.message || err);
} finally {
  child.kill();
}

console.log(JSON.stringify(results, null, 2));
