import { call } from "../src/client.js";

export default {
  name: "herdr_agent_get",
  description: "Get agent info by target (pane id, session id or path). Returns agent_status (idle/working/blocked/done/unknown), terminal_title, interactive_ready. Note: agent_status is nested under .agent.agent_status.",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "string",
        description: "Agent target (pane id, session id or path).",
      },
    },
    required: ["target"],
  },
  async handler(args) {
    return await call("agent.get", args);
  },
};
