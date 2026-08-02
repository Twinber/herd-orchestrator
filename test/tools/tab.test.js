import { describe, it } from "node:test";
import assert from "node:assert/strict";
import listTool from "../../tools/tab.list.js";
import getTool from "../../tools/tab.get.js";

describe("tab.list", () => {
  it("returns all tabs", async () => {
    const r = await listTool.handler({});
    assert.equal(r.type, "tab_list");
    assert.ok(Array.isArray(r.tabs));
    assert.ok(r.tabs.length > 0);
    for (const t of r.tabs) {
      assert.equal(typeof t.tab_id, "string");
    }
  });

  it("filters by workspace_id", async () => {
    const r = await listTool.handler({ workspace_id: "w1" });
    assert.ok(r.tabs.every((t) => t.workspace_id === "w1"));
  });
});

describe("tab.get", () => {
  it("returns info for a valid tab", async () => {
    const r = await getTool.handler({ tab_id: "w1:t3" });
    assert.equal(r.type, "tab_info");
    assert.equal(r.tab.tab_id, "w1:t3");
  });

  it("fails for an invalid tab_id", async () => {
    await assert.rejects(
      () => getTool.handler({ tab_id: "nonexistent" }),
      /tab.*not found/i
    );
  });
});
