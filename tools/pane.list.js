import { call } from "../src/client.js";

export default {
  name: "herdr_pane_list",
  description: "List all panes, optionally filtered to a workspace. Each pane has pane_id, cwd, agent_status, terminal info.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "Only list panes of this workspace (optional).",
      },
    },
  },
  async handler(args) {
    return await call("pane.list", args);
  },
};
