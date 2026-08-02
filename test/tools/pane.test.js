import { describe, it } from "node:test";
import assert from "node:assert/strict";
import listTool from "../../tools/pane.list.js";
import getTool from "../../tools/pane.get.js";

describe("pane.list", () => {
  it("returns all panes", async () => {
    const r = await listTool.handler({});
    assert.equal(r.type, "pane_list");
    assert.ok(Array.isArray(r.panes));
    assert.ok(r.panes.length > 0);
    for (const p of r.panes) {
      assert.equal(typeof p.pane_id, "string");
    }
  });
});

describe("pane.get", () => {
  it("returns info for a valid pane", async () => {
    const list = await listTool.handler({});
    const anyPaneId = list.panes[0].pane_id;
    const r = await getTool.handler({ pane_id: anyPaneId });
    assert.equal(r.type, "pane_info");
    assert.equal(r.pane.pane_id, anyPaneId);
    assert.equal(typeof r.pane.cwd, "string");
  });

  it("fails for an invalid pane_id", async () => {
    await assert.rejects(
      () => getTool.handler({ pane_id: "nonexistent" }),
      /pane.*not found/i
    );
  });
});
