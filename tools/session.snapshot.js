import { call } from "../src/client.js";

export default {
  name: "herdr_session_snapshot",
  description: "Dump the full herdr session: workspaces, tabs, panes, layouts and agents. Useful for debugging the entire state at once.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  async handler(args) {
    return await call("session.snapshot", args);
  },
};
