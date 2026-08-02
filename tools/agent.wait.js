import { call } from "../src/client.js";

export default {
  name: "herdr_agent_wait",
  description: "Block until the agent reaches one of the given statuses (idle, working, blocked, done, unknown). Alternative to polling agent.get in a loop.",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "string",
        description: "Agent target (pane id).",
      },
      until: {
        type: "array",
        items: {
          type: "string",
          enum: ["idle", "working", "blocked", "done", "unknown"],
        },
        description: "Statuses to wait for. Returns when the agent reaches any of these.",
      },
      timeout_ms: {
        type: "number",
        description: "How long to wait (null for server default).",
      },
    },
    required: ["target"],
  },
  async handler(args) {
    return await call("agent.wait", args);
  },
};
