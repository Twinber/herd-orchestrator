import { call } from "../src/client.js";

export default {
  name: "herdr_workspace_list",
  description: "List all open workspaces in herdr.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  async handler(args) {
    return await call("workspace.list", args);
  },
};
