import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { loadSchema, fetchSchema, buildTools } from "./src/schema.js";
import { call, getSocketPath } from "./src/client.js";

const { schema, source } = fetchSchema();
const tools = buildTools(schema);

const server = new Server(
  {
    name: "herdr",
    version: "0.1.0",
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.toolName,
    description: `${t.description}\n\nSocket: ${getSocketPath()}`,
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
    `[herdr-mcp] ready, ${tools.length} tools from schema protocol=${schema.protocol} (${source})\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[herdr-mcp] fatal: ${err.stack || err}\n`);
  process.exit(1);
});
