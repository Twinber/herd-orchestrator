import { call } from "../src/client.js";

export default {
  name: "herdr_worktree_list",
  description: "List git worktrees for a repository. Returns branch, path, is_linked_worktree, open_workspace_id for each.",
  inputSchema: {
    type: "object",
    properties: {
      cwd: {
        type: "string",
        description: "Directory inside the repo (optional, auto-detected if not provided).",
      },
      workspace_id: {
        type: "string",
        description: "Scope to a specific workspace (optional).",
      },
    },
  },
  async handler(args) {
    return await call("worktree.list", args);
  },
};
