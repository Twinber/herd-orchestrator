import { connect } from "node:net";
import { execFileSync } from "node:child_process";

const DEFAULT_SOCK = "/home/twinber/.config/herdr/herdr.sock";
const HERDR_BIN = "herdr";
const DEFAULT_TIMEOUT_MS = 30000;

let resolvedSocket = null;

// Resolve the herdr server socket via `herdr status server --json`, falling
// back to a well-known default path if discovery fails.
export function getSocketPath() {
  if (resolvedSocket) return resolvedSocket;

  try {
    const out = execFileSync(HERDR_BIN, ["status", "server", "--json"], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    const info = JSON.parse(out.toString("utf8"));
    if (info && typeof info.socket === "string" && info.socket) {
      resolvedSocket = info.socket;
      return resolvedSocket;
    }
  } catch {
    // fall through to the default path
  }

  resolvedSocket = DEFAULT_SOCK;
  return resolvedSocket;
}

export function call(method, params = {}, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      id: `mcp:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`,
      method,
      params,
    };

    const sock = connect(getSocketPath());
    let buf = Buffer.alloc(0);
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sock.destroy();
      fn(value);
    };

    const timer = setTimeout(() => {
      finish(reject, new Error(`herdr request timed out after ${timeoutMs}ms (method=${method})`));
    }, timeoutMs);

    sock.on("connect", () => {
      sock.write(JSON.stringify(req) + "\n");
    });

    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      let nl;
      while ((nl = buf.indexOf(10)) !== -1) {
        const line = buf.subarray(0, nl).toString("utf8");
        buf = buf.subarray(nl + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id !== req.id) continue;
        if (msg.error) {
          const err = new Error(msg.error.message || "herdr error");
          err.code = msg.error.code;
          err.herdr = true;
          finish(reject, err);
        } else {
          finish(resolve, msg.result);
        }
      }
    });

    sock.on("error", (err) => {
      finish(reject, new Error(`herdr socket error: ${err.message}`));
    });
  });
}
