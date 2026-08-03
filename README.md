# herd-orchestrator

**Multi-agent worktree orchestrator** — an MCP server, opencode commands, and an
installer that together turn any AI coding agent into a reactive orchestration
engine for git worktrees.

<video src="assets/demo.mp4" autoplay loop muted playsinline width="100%"></video>

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

## Workflow

The orchestrator turns a feature request into merged code through three layers:

### 1. Plan (`/plan-worktrees`)

You describe what you want to build. The command interviews you, identifies
parallelizable tasks (non-overlapping files, no dependencies), and writes a
config file with all the details:

```json
{
  "repo": { "cwd": "/path/to/repo", "base_branch": "main" },
  "issues": [
    { "id": "task-a", "branch": "tasks/task-a", "title": "...", "prompt": "..." },
    { "id": "task-b", "branch": "tasks/task-b", "title": "...", "prompt": "..." }
  ]
}
```

### 2. Orchestrate (`/orchestrate`)

You point the orchestrator at that config. It drives herdr through the MCP
tools to deploy one opencode agent per worktree **in parallel**:

```
worktree.create  →  agent.start  →  agent.prompt  →  agent.get/read/wait
     │                  │               │                 │
  Crea worktree     Lance agente     Envía tarea      Monitoriza
  + workspace       opencode en      al worker        (working/blocked/
                       el pane                         idle/done)
```

- **Worktrees are created from the base branch** — each worker starts from the
  same commit, so they can modify the same files without interfering.
- **Parallel execution** — the orchestrator deploys 3–5 workers concurrently,
  monitors them all at once, and handles blocked agents by reading the question
  and replying with the policy answer.
- **Cross-review loop** — when a worker finishes, a reviewer in a fresh pane
  inspects the diff. If it says `CHANGES_REQUESTED`, the feedback goes back to
  the same worker for fixes, then a new reviewer re-checks. Loop until
  `APPROVE` or `max_review_rounds` is exhausted.
- **Integration** — approved tasks are merged to the base branch sequentially.
  Git handles any conflicts automatically (ort strategy).
- **Cleanup** — workspaces and worktrees are removed; local branches are
  deleted.

### 3. Result

The orchestrator reports per task: status, review verdict, and merge result.
All commits land on the base branch, each task in its own merge commit, with
the original micro-commits preserved in the history.

### Real example

In a production run with the **app-clima** Flutter project (10 tasks), the
pipeline completed in three parallel rounds:

| Round | Tasks | Files | Result |
|-------|-------|-------|--------|
| 1 | weather-model, about-screen, pull-to-refresh | models, UI, routes | 3 merged |
| 2 | extended-conditions, sunrise-sunset, share-weather | widgets, forecast tiles | 3 merged (1 rework) |
| 3 | dark-mode, settings, temp-chart, favorite-cities | theme, settings, chart, favorites | 4 merged (1 rework) |

A cross-review loop triggered twice (about-screen: missing tests + label fix;
temp-chart: missing LineTouchData). Both were resolved in one rework round.

## Tests

```bash
npm test              # smoke test (MCP handshake + tools/list + tools/call)
npm run test:tools    # 13 unit tests for the 9 read-only tools
```

## License

MIT
