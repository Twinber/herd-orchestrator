import { call } from "../src/client.js";

export default {
  name: "herdr_pane_send_input",
  description: "Send text and/or key presses to a pane in one call. Used for warm-up (PING_REPLY_WITH_PONG) and sending commands. Keys are key names like Enter, CtrlC, Backspace.",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: {
        type: "string",
        description: "Id of the pane.",
      },
      text: {
        type: "string",
        description: "Literal text to type into the pane.",
      },
      keys: {
        type: "array",
        items: { type: "string" },
        description: "List of key names to press (e.g. Enter, CtrlC).",
      },
    },
    required: ["pane_id"],
  },
  async handler(args) {
    return await call("pane.send_input", args);
  },
};
