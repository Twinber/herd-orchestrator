import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tool from "../../tools/worktree.list.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("worktree.list", () => {
  it("lists worktrees for the herd-orchestrator repo", async () => {
    const r = await tool.handler({ cwd: REPO_ROOT });
    assert.equal(r.type, "worktree_list");
    assert.ok(Array.isArray(r.worktrees));
    for (const w of r.worktrees) {
      assert.equal(typeof w.branch, "string");
      assert.equal(typeof w.path, "string");
    }
  });
});
