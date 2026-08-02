import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "node:module";

import { loadSchema, fetchSchema, buildTools } from "./src/schema.js";
import { checkDocCoverage } from "./src/docs.js";
import { call, getSocketPath } from "./src/client.js";

const require = createRequire(import.meta.url);

if (process.argv.includes("--version")) {
  const pkg = require("./package.json");
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

const { schema, source } = fetchSchema();
const allTools = buildTools(schema);

const ORCHESTRATION_TOOLS = new Set([
  "ping",
  "session.snapshot",
  "workspace.list",
  "workspace.get",
  "tab.list",
  "tab.get",
  "pane.list",
  "pane.get",
  "pane.split",
  "pane.send_input",
  "pane.wait_for_output",
  "agent.start",
  "agent.prompt",
  "agent.get",
  "agent.wait",
  "agent.read",
  "agent.send_keys",
  "worktree.create",
  "worktree.remove",
  "worktree.list",
]);

const fullMode = process.argv.includes("--all");
const tools = fullMode
  ? allTools
  : allTools.filter((t) => ORCHESTRATION_TOOLS.has(t.method));

const drift = checkDocCoverage(schema);
if (drift.staleDocs.length || drift.staleFields.length || drift.missing.length) {
  process.stderr.write(
    `[herdr-mcp] docs drift: ${drift.missing.length} undocumented, ` +
      `${drift.staleDocs.length} stale methods, ${drift.staleFields.length} stale fields\n` +
      `  missing: ${drift.missing.join(", ") || "-"}\n` +
      `  stale docs: ${drift.staleDocs.join(", ") || "-"}\n` +
      `  stale fields: ${drift.staleFields.join(", ") || "-"}\n`
  );
}

const server = new Server(
  {
    name: "herdr",
    version: "0.1.0",
    socketPath: getSocketPath(),
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.toolName,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools.find((t) => t.toolName === req.params.name);
  if (!tool) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
      isError: true,
    };
  }

  const args = req.params.arguments ?? {};
  try {
    const result = await call(tool.method, args);
    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `herdr ${tool.method} failed: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[herdr-mcp] ready, ${tools.length}/${allTools.length} tools (${fullMode ? "full" : "orchestration"} mode) protocol=${schema.protocol} (${source})\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[herdr-mcp] fatal: ${err.stack || err}\n`);
  process.exit(1);
});
