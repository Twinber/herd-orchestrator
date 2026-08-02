# herdr-mcp

A Model Context Protocol (MCP) server that exposes the **Herdr terminal API** as callable tools for AI agents.

Herdr is a terminal workspace manager for AI coding agents. Its API is defined by a JSON Schema (JSON-RPC over a Unix socket). This MCP server reads that schema at startup and dynamically registers **every API method as an MCP tool**, so an agent can drive Herdr directly — split panes, read terminal output, manage workspaces/tabs, prompt agents, and more — using typed, easy-to-call tools instead of raw socket calls.

## Features

- **Auto-generated tools** — tools are built from the API schema, not hand-written. When the schema changes, the tool set updates automatically on the next server start.
- **~90 tools** covering `workspace.*`, `tab.*`, `pane.*`, `agent.*`, `layout.*`, `plugin.*`, `events.*`, `integration.*`, and more.
- **Dynamic schema export** — on startup the MCP runs `herdr api schema --output <mcp-dir>/schema.json` and caches the schema next to the server. If the export fails, it falls back to the cached copy.
- **Dynamic socket discovery** — the Herdr socket path is resolved automatically via `herdr status server --json`.
- **Curated docs with drift detection** — every tool ships with hand-written descriptions of what it does and what its fields mean, while the *shape* (types, required args, enums) always comes from the live schema. Destructive tools (`workspace.close`, `pane.close`, `server.stop`, ...) are flagged with a `WARNING:` prefix. If the schema outgrows the docs, the server warns about it on startup.
- **Auto-timeouts** — calls are capped by a client-side timeout (30s by default), and blocking tools that accept `timeout_ms` are given enough headroom to complete instead of being cut short.
- **Zero-config** — no environment variables or configuration required.

## How it works

1. **Startup**: the server exports the current API schema from the running Herdr server (`herdr api schema`) and builds the tool definitions (name, description, input schema) from it.
2. **Call**: when a tool is invoked, the server sends the corresponding JSON-RPC request over the Herdr Unix socket and returns the result.

Tool naming follows `herdr_<method>` (dots become underscores), e.g. `herdr_pane_split`, `herdr_agent_prompt`, `herdr_workspace_list`.

### Docs layer and schema drift

Tool definitions come from two layers:

- **Shape** (types, required args, enums, field names) is always derived from the **live exported schema** — it can never go stale.
- **Prose** (what a method does, what a field means) comes from a curated map in `src/docs.js`.

Because the prose is curated by hand while the schema is exported fresh, the two can drift when Herdr changes its API. On startup the server runs a coverage check (`checkDocCoverage` in `src/docs.js`) and logs a warning to stderr listing:

- **undocumented** methods — present in the schema but without curated docs (they still work, using a generic fallback description);
- **stale docs** — curated entries for methods that no longer exist in the schema;
- **stale fields** — curated field docs for params that no longer exist on a method.

Adding or fixing an entry in `src/docs.js` is the only maintenance needed when a warning appears. New methods keep working with the generic description until they are documented.

## Requirements

- **Node.js 18+**
- **Herdr** installed and running (the MCP talks to the Herdr server socket and uses the `herdr` CLI to export the schema and discover the socket). The `herdr` binary must be on `PATH`.
- **opencode** (to register the MCP server)

## Installation in opencode

1. Clone or copy the project to the target machine:

   ```bash
   git clone git@github.com:Twinber/herdr-mcp.git
   cd herdr-mcp
   npm install
   ```

2. Register the server in `~/.config/opencode/opencode.jsonc`:

   ```jsonc
   {
     "$schema": "https://opencode.ai/config.json",
     "mcp": {
       "herdr": {
         "type": "local",
         "command": ["node", "/home/<YOUR_USER>/herdr-mcp/server.js"],
         "enabled": true
       }
     }
   }
   ```

   > Adjust the path in `command` to match where you cloned the repo.

3. Restart opencode. The `herdr_*` tools will be available to agents (shown as `herdr_herdr_*`).

## Development

```bash
npm test        # run the smoke test (initializes the MCP, lists tools, calls herdr_pane_list)
npm start       # run the server directly (stdio transport)
```

The smoke test spawns the server over stdio, performs the MCP handshake, verifies `tools/list`, and makes a real `tools/call` against your running Herdr instance.

## Multi-agent orchestration with `/orquestate`

`/orquestate` is an opencode command that turns an opencode agent into a
reactive orchestrator. It drives the herdr MCP tools to launch one opencode
subagent per git worktree, monitor/unblock them, cross-review, merge, push and
open PRs — reacting to what it observes instead of predicting states.

Usage (from any opencode session with the herdr MCP connected):

```
/orquestate /path/to/factory/config.json
/orquestate <inline JSON>
```

The config format and pipeline are documented in
`.opencode/command/orquestate.md`. Example configs live in `factory/`
(`config.example.json`, `test-1.json`, `test-blocked.json`).

## Project layout

```
herdr-mcp/
├── server.js          # MCP server entry (stdio transport, tools/list + tools/call)
├── src/
│   ├── schema.js      # loads/exports the API schema and builds tool definitions
│   ├── docs.js        # curated docs layer + checkDocCoverage (drift detection)
│   └── client.js      # JSON-RPC client for the Herdr Unix socket
├── .opencode/
│   └── command/orquestate.md  # /orquestate orchestrator instructions
├── factory/           # example configs consumed by /orquestate
├── test/
│   └── smoke.js       # end-to-end smoke test
├── schema.json        # generated cache of the exported schema (gitignored)
└── package.json
```

## License

MIT
