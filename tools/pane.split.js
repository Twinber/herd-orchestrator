import { call } from "../src/client.js";

export default {
  name: "herdr_pane_split",
  description: "Split a pane, creating a new pane to the right or below. Returns the new pane's pane_id. Essential for launching reviewers in a clean pane.",
  inputSchema: {
    type: "object",
    properties: {
      direction: {
        type: "string",
        enum: ["right", "down"],
        description: "Where to place the new pane: right or down.",
      },
      target_pane_id: {
        type: "string",
        description: "Pane to split (defaults to the focused pane).",
      },
      cwd: {
        type: "string",
        description: "Working directory for the new pane.",
      },
      ratio: {
        type: "number",
        description: "Split ratio (0-1).",
      },
      focus: {
        type: "boolean",
        description: "Focus the new pane after creation.",
      },
    },
    required: ["direction"],
  },
  async handler(args) {
    return await call("pane.split", args);
  },
};
