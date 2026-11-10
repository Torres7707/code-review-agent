import { describe, expect, it } from "vitest";
import { parsePatch, toFileDiffs } from "@/lib/diff";

describe("parsePatch", () => {
  it("numbers added and removed lines from the hunk header", () => {
    const patch = [
      "@@ -10,3 +10,4 @@ function useThing() {",
      " const a = 1;",
      "-const b = 2;",
      "+const b = 3;",
      "+const c = 4;",
      " return a;",
    ].join("\n");

    expect(parsePatch(patch)).toEqual([
      { type: "context", oldNo: 10, newNo: 10, content: "const a = 1;", severity: null, issueId: null },
      { type: "del", oldNo: 11, content: "const b = 2;", severity: null, issueId: null },
      { type: "add", newNo: 11, content: "const b = 3;", severity: null, issueId: null },
      { type: "add", newNo: 12, content: "const c = 4;", severity: null, issueId: null },
      { type: "context", oldNo: 12, newNo: 13, content: "return a;", severity: null, issueId: null },
    ]);
  });

  it("resets numbering on each hunk", () => {
    const patch = [
      "@@ -1,2 +1,2 @@",
      " first",
      "-gone",
      "+kept",
      "@@ -40,2 +40,2 @@",
      " later",
    ].join("\n");

    const lines = parsePatch(patch);
    expect(lines.map((l) => l.content)).toEqual(["first", "gone", "kept", "later"]);
    expect(lines[3]).toMatchObject({ type: "context", oldNo: 40, newNo: 40 });
  });

  it("tracks old and new line numbers independently", () => {
    const patch = ["@@ -5,4 +5,4 @@", "-a", "-b", "+c", " d"].join("\n");
    const lines = parsePatch(patch);

    expect(lines.filter((l) => l.type === "del").map((l) => l.oldNo)).toEqual([5, 6]);
    expect(lines.filter((l) => l.type === "add").map((l) => l.newNo)).toEqual([5]);
    expect(lines.find((l) => l.type === "context")).toMatchObject({ oldNo: 7, newNo: 6 });
  });

  it("ignores no-newline markers and empty lines", () => {
    const patch = ["@@ -1,1 +1,1 @@", "-old", "+new", "\\ No newline at end of file", ""].join("\n");
    expect(parsePatch(patch).map((l) => l.content)).toEqual(["old", "new"]);
  });

  it("keeps leading whitespace that is part of the code", () => {
    const patch = ["@@ -1,1 +1,1 @@", "+  const x = 1;", "+"].join("\n");
    expect(parsePatch(patch).map((l) => l.content)).toEqual(["  const x = 1;", ""]);
  });

  it("returns nothing for a patch without a hunk header", () => {
    expect(parsePatch("Binary files a/x.png and b/x.png differ")).toEqual([]);
  });
});

describe("toFileDiffs", () => {
  it("drops files GitHub reported without a patch (binary / too large)", () => {
    const diffs = toFileDiffs([
      { filename: "src/a.ts", additions: 1, deletions: 0, patch: "@@ -1 +1 @@\n+x" },
      { filename: "logo.png", additions: 0, deletions: 0 },
    ]);
    expect(diffs.map((d) => d.path)).toEqual(["src/a.ts"]);
  });

  it("preserves addition and deletion counts", () => {
    const [diff] = toFileDiffs([
      { filename: "src/a.ts", additions: 7, deletions: 3, patch: "@@ -1,3 +1,7 @@\n+x" },
    ]);
    expect(diff).toMatchObject({ additions: 7, deletions: 3 });
  });
});
