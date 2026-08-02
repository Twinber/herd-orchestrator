import { call } from "../src/client.js";

export default {
  name: "herdr_pane_get",
  description: "Get pane info by id. Returns cwd, terminal_id, agent_status, agent (if running opencode), terminal_title, scroll info.",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: {
        type: "string",
        description: "Id of the pane (e.g. w1:p1).",
      },
    },
    required: ["pane_id"],
  },
  async handler(args) {
    return await call("pane.get", args);
  },
};
