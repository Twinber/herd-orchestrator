import { describe, it } from "node:test";
import assert from "node:assert/strict";
import tool from "../../tools/ping.js";

describe("ping", () => {
  it("returns pong with version and protocol", async () => {
    const r = await tool.handler({});
    assert.equal(r.type, "pong");
    assert.equal(typeof r.version, "string");
    assert.equal(typeof r.protocol, "number");
    assert.ok(r.version.length > 0);
  });
});
