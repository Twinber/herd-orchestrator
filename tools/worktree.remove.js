import { call } from "../src/client.js";

export default {
  name: "herdr_worktree_remove",
  description: "WARNING: Destructive: deletes the worktree checkout and closes its workspace. Does NOT delete the git branch (use git branch -D separately).",
  inputSchema: {
    type: "object",
    properties: {
      workspace_id: {
        type: "string",
        description: "Workspace of the worktree to remove.",
      },
      force: {
        type: "boolean",
        description: "Force removal even if the worktree has uncommitted changes (default false).",
      },
    },
    required: ["workspace_id"],
  },
  async handler(args) {
    return await call("worktree.remove", args);
  },
};
