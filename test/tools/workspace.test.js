import { describe, it } from "node:test";
import assert from "node:assert/strict";
import listTool from "../../tools/workspace.list.js";
import getTool from "../../tools/workspace.get.js";

describe("workspace.list", () => {
  it("returns all workspaces", async () => {
    const r = await listTool.handler({});
    assert.equal(r.type, "workspace_list");
    assert.ok(Array.isArray(r.workspaces));
    assert.ok(r.workspaces.length > 0);
    for (const w of r.workspaces) {
      assert.equal(typeof w.workspace_id, "string");
      assert.equal(typeof w.label, "string");
    }
  });
});

describe("workspace.get", () => {
  it("returns info for a valid workspace", async () => {
    const r = await getTool.handler({ workspace_id: "w1" });
    assert.equal(r.type, "workspace_info");
    assert.equal(r.workspace.workspace_id, "w1");
  });

  it("fails for an invalid workspace_id", async () => {
    await assert.rejects(
      () => getTool.handler({ workspace_id: "nonexistent" }),
      /workspace.*not found/i
    );
  });
});
