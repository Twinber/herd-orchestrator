import { call } from "../src/client.js";

export default {
  name: "herdr_agent_prompt",
  description: "Send a prompt to an agent running in a pane. Optionally block until the agent reaches one of these statuses: idle, working, blocked, done, unknown.",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "string",
        description: "Agent target (pane id, session id or path).",
      },
      text: {
        type: "string",
        description: "The prompt text to send.",
      },
      wait: {
        type: "array",
        items: {
          type: "string",
          enum: ["idle", "working", "blocked", "done", "unknown"],
        },
        description: "Optionally block until the agent reaches one of these statuses.",
      },
    },
    required: ["target", "text"],
  },
  async handler(args) {
    return await call("agent.prompt", args);
  },
};
