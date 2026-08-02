import { call } from "../src/client.js";

export default {
  name: "herdr_workspace_get",
  description: "Get a single workspace by id. Returns label, tab/pane count, worktree info if linked.",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "Id of the workspace (e.g. w1, w2).",
      },
    },
    required: ["workspace_id"],
  },
  async handler(args) {
    return await call("workspace.get", args);
  },
};
