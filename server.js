import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "node:module";

import tools from "./tools/index.js";
import { getSocketPath } from "./src/client.js";

const require = createRequire(import.meta.url);

if (process.argv.includes("--version")) {
  const pkg = require("./package.json");
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
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
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools.find((t) => t.name === req.params.name);
  if (!tool) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(req.params.arguments ?? {});
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
      content: [{ type: "text", text: `herdr ${tool.name} failed: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[herdr-mcp] ready, ${tools.length} tools (hand-crafted mode)\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[herdr-mcp] fatal: ${err.stack || err}\n`);
  process.exit(1);
});
