import { call } from "../src/client.js";

export default {
  name: "herdr_worktree_create",
  description: "Create a git worktree and open it as a herdr workspace. Returns workspace_id, root_pane.pane_id (for agent.start), and worktree info. The pane may need retries for agent.start if 'not an available shell'.",
  inputSchema: {
    type: "object",
    properties: {
      branch: {
        type: "string",
        description: "Branch to create/checkout in the worktree.",
      },
      path: {
        type: "string",
        description: "Where to create the worktree directory.",
      },
      base: {
        type: "string",
        description: "Base ref to create the branch from (e.g. main, master).",
      },
      cwd: {
        type: "string",
        description: "Repository directory (optional, defaults to worktree detection).",
      },
      label: {
        type: "string",
        description: "Workspace label (optional).",
      },
      focus: {
        type: "boolean",
        description: "Focus the new workspace after creation.",
      },
    },
    required: ["branch", "path"],
  },
  async handler(args) {
    return await call("worktree.create", args);
  },
};
