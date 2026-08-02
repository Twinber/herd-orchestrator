import { call } from "../src/client.js";

export default {
  name: "herdr_agent_send_keys",
  description: "Send key presses to an agent's terminal. Useful for recovery (CtrlC to interrupt a stuck agent) or TUI navigation.",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "string",
        description: "Agent target (pane id).",
      },
      keys: {
        type: "array",
        items: { type: "string" },
        description: "List of key names (e.g. CtrlC, Enter, Escape).",
      },
    },
    required: ["target", "keys"],
  },
  async handler(args) {
    return await call("agent.send_keys", args);
  },
};
