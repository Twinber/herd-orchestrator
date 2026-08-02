import { call } from "../src/client.js";

export default {
  name: "herdr_agent_start",
  description: "Launch an opencode agent in a pane. Returns agent info. May need retries if the pane is not ready yet ('not an available shell').",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: {
        type: "string",
        description: "Id of the pane to launch the agent in.",
      },
      name: {
        type: "string",
        description: "Agent name/identifier.",
      },
      kind: {
        type: "string",
        description: "Agent kind/integration. Use 'opencode'.",
      },
      args: {
        type: "array",
        items: { type: "string" },
        description: "Extra CLI args for opencode.",
      },
      timeout_ms: {
        type: "number",
        description: "Startup timeout in milliseconds. Values must be greater than 3000 and at most 300000.",
      },
    },
    required: ["pane_id", "name", "kind"],
  },
  async handler(args) {
    return await call("agent.start", args);
  },
};
