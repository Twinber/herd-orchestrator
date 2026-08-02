# herdr-mcp

A Model Context Protocol (MCP) server that exposes **20 hand-crafted tools** from the Herdr terminal API for AI agents — focused exclusively on multi-agent orchestration with git worktrees.

Each tool lives in its own file in `tools/`, with explicit input schemas, descriptions, and a direct JSON-RPC call to the Herdr Unix socket. No schema auto-generation, no magic.

## Features

- **20 curated tools** — only what's needed for worktree orchestration: `worktree.*`, `agent.*`, `pane.*`, `workspace.*`, `tab.*`, `ping`, `session.snapshot`. No noise from graphics, plugins, layout management, or reporting APIs.
- **One file per tool** — each tool in `tools/<method>.js` exports `{ name, description, inputSchema, handler }`. Easy to read, test, and modify.
- **WARNING prefix** on destructive tools (`worktree.remove`) to make the risk visible in the agent's tool list.
- **Auto-timeouts** — calls are capped by a client-side timeout (30s by default), and blocking tools that accept `timeout_ms` are given enough headroom to complete instead of being cut short.
- **Dynamic socket discovery** — the Herdr socket path is resolved automatically via `herdr status server --json`.
- **Zero-config** — no environment variables or configuration required.

## How it works

1. **Startup**: the server loads the 20 tool definitions from `tools/index.js`.
2. **Call**: when a tool is invoked, the server sends the corresponding JSON-RPC request over the Herdr Unix socket and returns the result.

Tool naming follows `herdr_<method>` (dots become underscores), e.g. `herdr_pane_split`, `herdr_agent_prompt`, `herdr_worktree_create`.

## Requirements

- **Node.js 18+**
- **Herdr** installed and running (the MCP talks to the Herdr server socket and discovers the socket path via `herdr status server --json`). The `herdr` binary must be on `PATH`.
- **opencode** (to register the MCP server)

## Installation in opencode

The included installer registers the MCP server in opencode's config and copies
**all** commands from `commands/` (`/orchestrate`, `/plan-worktrees`)
into opencode's command directory — **without breaking any existing config**
(comments, formatting and unrelated MCP servers are preserved).

1. Clone or copy the project to the target machine:

   ```bash
   git clone git@github.com:Twinber/herdr-mcp.git
   cd herdr-mcp
   npm install
   ```

2. Run the installer:

   ```bash
   ./install.sh          # install globally (~/.config/opencode)
   ./install.sh --project # install into the current project's .opencode/
   ```

   Options:

   - `--dry-run` — show what would change without writing anything;
   - `--no-test` — skip the automatic `npm install` + smoke test;
   - `--all` — expose all 89 herdr API tools (default: restricted to 20 orchestration tools).

   The installer is idempotent: re-running it leaves an already-registered
   `mcp.herdr` untouched, and it refuses to touch an unparseable config
   (aborting with nothing changed).

3. Restart opencode. The `herdr_*` tools will be available to agents (shown as `herdr_herdr_*`), and the `/orchestrate` and `/plan-worktrees` commands will be available globally.

### Tool modes

By default the server exposes only the **20 tools** needed for worktree
orchestration (`worktree.*`, `agent.*`, `pane.*` (split/send_input/
wait_for_output/list/get), `workspace.*`, `tab.*`, `ping`, `session.snapshot`).
Destructive or noisy tools (`workspace.close`, `tab.close`, `pane.close`,
`server.stop`, graphics, plugins, layout, reporting, ...) are excluded.

To expose **all 89 tools** (e.g. for full herdr API access), pass `--all` to the
installer or to `server.js` directly:

```bash
./install.sh --all
# or in opencode.jsonc:
# "command": ["node", "/path/to/server.js", "--all"]
```

## Development

```bash
npm test        # run the smoke test (initializes the MCP, lists tools, calls herdr_pane_list)
npm start       # run the server directly (stdio transport)
```

The smoke test spawns the server over stdio, performs the MCP handshake, verifies `tools/list`, and makes a real `tools/call` against your running Herdr instance.

## Multi-agent orchestration with `/orchestrate`

`/orchestrate` is an opencode command that turns an opencode agent into a
reactive orchestrator. It drives the herdr MCP tools to launch one opencode
subagent per git worktree, monitor/unblock them, cross-review, merge, push and
open PRs — reacting to what it observes instead of predicting states.

Usage (from any opencode session with the herdr MCP connected):

```
/orchestrate /path/to/tasks/config.json
/orchestrate <inline JSON>
```

The config format and pipeline are documented in
`commands/orchestrate.md`. Example configs live in `tasks/`
(`config.example.json`, `test-1.json`, `test-blocked.json`).

## Planning with `/plan-worktrees`

`/plan-worktrees` is the companion planning command. It interviews you about a
feature or fix you want, decomposes it into **parallelizable tasks** (non
overlapping files, no inter-task dependencies), and writes the factory JSON that
`/orchestrate` consumes directly.

```
/plan-worktrees  # then answer the interviewer's questions
/plan-worktrees  Add a station search box and a country filter to the map page
```

It asks questions via the `question` tool until the repo details and the task
decomposition are unambiguous, writes the config to
`<repo>/tasks/<date>-<slug>.json`, summarizes the plan, and hands off with
`/orchestrate <file>`.

## Project layout

```
herdr-mcp/
├── server.js              # MCP entry (stdio transport, tools/list + tools/call)
├── install.sh             # installer entrypoint
├── scripts/
│   └── install.mjs        # merges mcp.herdr into opencode config, copies commands
├── tools/
│   ├── index.js            # collects all 20 tool definitions
│   ├── ping.js
│   ├── session.snapshot.js
│   ├── workspace.list.js / workspace.get.js
│   ├── tab.list.js / tab.get.js
│   ├── pane.list.js / pane.get.js / pane.split.js / pane.send_input.js / pane.wait_for_output.js
│   ├── agent.start.js / agent.prompt.js / agent.get.js / agent.wait.js / agent.read.js / agent.send_keys.js
│   └── worktree.create.js / worktree.remove.js / worktree.list.js
├── src/
│   └── client.js           # JSON-RPC client for the Herdr Unix socket
├── commands/              # /orchestrate + /plan-worktrees commands
├── tasks/                # task configs for /orchestrate
├── test/
│   └── smoke.js           # end-to-end smoke test
└── package.json
```

## License

MIT
