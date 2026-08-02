import { call } from "../src/client.js";

export default {
  name: "herdr_tab_list",
  description: "List tabs, optionally filtered to a workspace. Each tab has tab_id, label, pane_count, agent_status.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "Only list tabs of this workspace (optional).",
      },
    },
  },
  async handler(args) {
    return await call("tab.list", args);
  },
};
