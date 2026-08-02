import { call } from "../src/client.js";

export default {
  name: "herdr_tab_get",
  description: "Get a single tab by id. Returns label, pane_count, workspace_id, agent_status.",
  inputSchema: {
    type: "object",
    properties: {
      tab_id: {
        type: "string",
        description: "Id of the tab (e.g. w1:t1).",
      },
    },
    required: ["tab_id"],
  },
  async handler(args) {
    return await call("tab.get", args);
  },
};
