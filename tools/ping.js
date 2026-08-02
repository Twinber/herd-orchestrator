import { call } from "../src/client.js";

export default {
  name: "herdr_ping",
  description: "Ping the herdr server. Returns the server version and protocol.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  async handler(args) {
    return await call("ping", args);
  },
};
