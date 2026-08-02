import { describe, it } from "node:test";
import assert from "node:assert/strict";
import tool from "../../tools/session.snapshot.js";

describe("session.snapshot", () => {
  it("returns snapshot with expected top-level keys", async () => {
    const r = await tool.handler({});
    assert.equal(r.type, "session_snapshot");
    assert.ok(r.snapshot);
    assert.ok(Array.isArray(r.snapshot.workspaces));
    assert.ok(Array.isArray(r.snapshot.tabs));
    assert.ok(Array.isArray(r.snapshot.panes));
    assert.equal(typeof r.snapshot.focused_workspace_id, "string");
  });
});
