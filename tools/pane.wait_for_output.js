import { call } from "../src/client.js";

export default {
  name: "herdr_pane_wait_for_output",
  description: "Block until the pane output matches a substring or regex, then return the read. More efficient than polling. Returns the matched output lines.",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: {
        type: "string",
        description: "Id of the pane.",
      },
      source: {
        type: "string",
        enum: ["visible", "recent", "recent_unwrapped", "detection"],
        description: "Buffer to watch: visible, recent, recent_unwrapped or detection.",
      },
      match: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["substring", "regex"],
            description: "substring (exact text) or regex (pattern).",
          },
          value: {
            type: "string",
            description: "Text to match (for substring) or regex pattern.",
          },
        },
        required: ["type", "value"],
        description: "Match spec: {type:'substring'|'regex', value}.",
      },
      timeout_ms: {
        type: "number",
        description: "How long to wait (null for server default).",
      },
      strip_ansi: {
        type: "boolean",
        description: "Strip ANSI escape sequences (default true).",
      },
      lines: {
        type: "number",
        description: "Max lines in the returned read.",
      },
    },
    required: ["pane_id", "source", "match"],
  },
  async handler(args) {
    return await call("pane.wait_for_output", args);
  },
};
