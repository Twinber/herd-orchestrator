import { call } from "../src/client.js";

export default {
  name: "herdr_agent_read",
  description: "Read recent output from an agent's terminal. Used to check for TASK_COMPLETE, blocked questions, or any agent output. For warm-up: read ~400 lines from 'recent' looking for PONG.",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "string",
        description: "Agent target (pane id).",
      },
      source: {
        type: "string",
        enum: ["visible", "recent", "recent_unwrapped", "detection"],
        description: "Buffer to read: visible, recent, recent_unwrapped or detection.",
      },
      lines: {
        type: "number",
        description: "Maximum number of lines to read.",
      },
      format: {
        type: "string",
        enum: ["text", "ansi"],
        description: "text or ansi (keeps ANSI codes).",
      },
      strip_ansi: {
        type: "boolean",
        description: "Strip ANSI escape sequences (default true).",
      },
    },
    required: ["target", "source"],
  },
  async handler(args) {
    return await call("agent.read", args);
  },
};
