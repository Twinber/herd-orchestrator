#!/usr/bin/env node
// Installer for herdr-mcp: registers the MCP server and the /orchestrate command
// in the user's global opencode config WITHOUT breaking existing settings.
//
// What it does:
//   1. Merges the "herdr" MCP entry into ~/.config/opencode/opencode.json(c)
//      (or project .opencode/opencode.json when --project is passed), keeping
//      every other key intact.
//   2. Copies .opencode/command/orchestrate.md to the global command dir.
//   3. Re-installs deps and runs the smoke test to validate.
//
// Flags:
//   --project   install into the current project's .opencode/ instead of global
//   --dry-run   show what would change without writing
//   --no-test   skip dependency install + smoke test

import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { parseTree, modify, applyEdits, parse } from "jsonc-parser";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const args = process.argv.slice(2);
const PROJECT = args.includes("--project");
const DRY_RUN = args.includes("--dry-run");
const NO_TEST = args.includes("--no-test");
const FULL_MODE = args.includes("--all");

const OPENCODE_GLOBAL_DIR = join(homedir(), ".config", "opencode");
const OPENCODE_PROJECT_DIR = join(process.env.OPENCODE_PROJECT_CWD || process.cwd(), ".opencode");
const COMMAND_SOURCE_DIR = join(ROOT, "commands");

// --- helpers -------------------------------------------------------------

function log(msg) {
  process.stdout.write(`[install] ${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`[install][warn] ${msg}\n`);
}

function err(msg) {
  process.stderr.write(`[install][error] ${msg}\n`);
  process.exit(1);
}

// Locate the existing opencode config file (json or jsonc) in a directory, or
// the default name to create.
function findConfig(dir) {
  for (const name of ["opencode.jsonc", "opencode.json"]) {
    const p = join(dir, name);
    if (existsSync(p)) return { path: p, name };
  }
  return { path: join(dir, "opencode.jsonc"), name: "opencode.jsonc" };
}

// Deep-merge the "herdr" MCP entry into the parsed config.
// Returns { existing } where existing is the current mcp.herdr value (or null).
function readMcp(cfg) {
  return cfg && typeof cfg.mcp === "object" && cfg.mcp.herdr ? cfg.mcp.herdr : null;
}

// --- main -----------------------------------------------------------------

const MODE_LABEL = FULL_MODE ? "full" : "orchestration";
log(`herdr-mcp installer (project=${PROJECT}, mode=${MODE_LABEL})`);

if (!existsSync(COMMAND_SOURCE_DIR)) {
  err(`command source dir not found: ${COMMAND_SOURCE_DIR}`);
}

const configDir = PROJECT ? OPENCODE_PROJECT_DIR : OPENCODE_GLOBAL_DIR;
const { path: configPath, name } = findConfig(configDir);
const raw = existsSync(configPath) ? readFileSync(configPath, "utf8") : null;

log(`opencode config: ${configPath} (${raw ? "exists" : "will be created"})`);

// 1. MCP registration
let nextConfig = raw ?? "";
const mcpCommand = FULL_MODE
  ? ["node", join(ROOT, "server.js"), "--all"]
  : ["node", join(ROOT, "server.js")];

if (raw) {
  const tree = parseTree(raw);
  if (!tree) err(`config at ${configPath} is not valid JSONC — aborting (nothing changed)`);

  const parseErrors = [];
  const cfg = parse(raw, parseErrors);
  if (parseErrors.length) err(`config at ${configPath} could not be parsed — aborting (nothing changed)`);
  const existing = readMcp(cfg);

  if (existing && existing.enabled !== false) {
    log("mcp.herdr already present and enabled — leaving it untouched");
  } else {
    // Use jsonc-parser.modify to insert/update only mcp.herdr, preserving the
    // formatting and comments of everything else in the file.
    const edits = modify(raw, ["mcp", "herdr"], {
      type: "local",
      command: mcpCommand,
      enabled: true,
    }, { formattingOptions: { insertSpaces: true, tabSize: 2 } });
    nextConfig = applyEdits(raw, edits);
    if (DRY_RUN) log("[dry-run] would add mcp.herdr -> node " + join(ROOT, "server.js"));
    else log("added mcp.herdr -> node " + join(ROOT, "server.js"));
  }
} else {
  const cfg = {
    $schema: "https://opencode.ai/config.json",
    mcp: { herdr: { type: "local", command: mcpCommand, enabled: true } },
  };
  nextConfig = JSON.stringify(cfg, null, 2) + "\n";
  if (DRY_RUN) log("[dry-run] would create config with mcp.herdr");
  else log(`creating ${configPath} with mcp.herdr`);
}

// 2. Command installation (copies every *.md command so /orchestrate,
//    /plan-worktrees, ... are all installed)
const commandDir = join(configDir, "command");
const commandSources = existsSync(COMMAND_SOURCE_DIR)
  ? readdirSync(COMMAND_SOURCE_DIR).filter((f) => f.endsWith(".md"))
  : [];

for (const name of commandSources) {
  const source = join(COMMAND_SOURCE_DIR, name);
  const target = join(commandDir, name);
  if (DRY_RUN) {
    log(`[dry-run] would copy ${source} -> ${target}`);
  } else {
    mkdirSync(commandDir, { recursive: true });
    copyFileSync(source, target);
    log(`installed command -> ${target}`);
  }
}

if (commandSources.length === 0) {
  warn(`no commands found in ${COMMAND_SOURCE_DIR}`);
}

// 3. Apply config changes
if (!DRY_RUN) {
  if (nextConfig !== raw) {
    // Preserve any original permission bits.
    let mode;
    try {
      mode = raw ? (statSync(configPath).mode & 0o777) : 0o644;
    } catch {
      mode = 0o644;
    }
    writeFileSync(configPath, nextConfig, { mode });
    log(`wrote ${configPath}`);
  }
}

// 4. Validate
if (!NO_TEST && !DRY_RUN) {
  log("installing deps...");
  const deps = spawnSync("npm", ["install"], { cwd: ROOT, stdio: "inherit" });
  if (deps.status !== 0) err("npm install failed");

  log("running smoke test...");
  const test = spawnSync("npm", ["test"], { cwd: ROOT, stdio: "inherit" });
  if (test.status !== 0) err("smoke test failed — herdr server may not be running");
  log("smoke test passed");
}

log("done.");
if (!PROJECT) {
  log("restart opencode for the changes to take effect.");
}
