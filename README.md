# herd-orchestrator

**Multi-agent worktree orchestrator** — an MCP server, opencode commands, and an
installer that together turn any AI coding agent into a reactive orchestration
engine for git worktrees.

```
herd-orchestrator/
├── server.js           # MCP server (20 tools)
├── commands/           # /orchestrate + /plan-worktrees
├── tools/              # one file per MCP tool
├── install.sh          # one-command installer
├── test/               # smoke test + tool tests
└── src/client.js       # JSON-RPC client for herdr
```

## What it includes

### MCP server (`server.js`)

20 hand-crafted tools that expose the Herdr terminal API through the Model
Context Protocol. No schema auto-generation — each tool is a file with explicit
input schemas and descriptions. Only orchestration-relevant tools are included
by default (`worktree.*`, `agent.*`, `pane.*`, `workspace.*`, `tab.*`). Pass
`--all` to expose the full 89-tool herdr API.

### Commands (`commands/`)

| Command | What it does |
|---------|-------------|
| `/orchestrate` | Reads a task config, deploys workers in parallel worktrees, monitors/unblocks them, cross-reviews with a rework loop, merges, and cleans up |
| `/plan-worktrees` | Interviews you about a feature, decomposes it into parallelizable tasks, and writes the config that `/orchestrate` consumes |

Both commands ship with the operating knowledge learned from real runs (agent
start races, TUI prompt swallowing, nested status fields, blocked handling).

### Installer (`install.sh`)

Registers the MCP server in opencode's config and copies all commands to
opencode's command directory — without touching your existing MCP entries or
configuration. Idempotent, safe with invalid configs, supports `--dry-run`.

## Requirements

- **Node.js 18+**
- **Herdr** running (socket discovered via `herdr status server --json`)
- **opencode** (to use the commands)

## Installation

```bash
git clone git@github.com:Twinber/herd-orchestrator.git
cd herd-orchestrator
npm install
./install.sh          # global install (~/.config/opencode)
```

Options: `--project`, `--all`, `--dry-run`, `--no-test`.

Restart opencode. The `herdr_*` MCP tools and `/orchestrate` + `/plan-worktrees`
commands will be available.

## Tests

```bash
npm test              # smoke test (MCP handshake + tools/list + tools/call)
npm run test:tools    # 13 unit tests for the 9 read-only tools
```

## License

MIT
