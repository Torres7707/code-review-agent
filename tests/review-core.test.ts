import { describe, expect, it } from "vitest";
import {
  anchorReviewLines,
  annotateDiffWithIssues,
  countBySeverity,
  issuesFromReview,
  matchDiffFile,
  reviewCoverage,
} from "@/lib/review-core";
import type { FileDiff } from "@/lib/types";

function file(path: string, newLineNumbers: number[], scope: FileDiff["scope"] = "full"): FileDiff {
  return {
    path,
    additions: newLineNumbers.length,
    deletions: 0,
    scope,
    lines: newLineNumbers.map((newNo) => ({
      type: "add" as const,
      newNo,
      content: `line ${newNo}`,
      severity: null,
      issueId: null,
    })),
  };
}

describe("issuesFromReview", () => {
  it("returns nothing when the review is still empty", () => {
    expect(issuesFromReview(undefined, "pr-1")).toEqual([]);
    expect(issuesFromReview({}, "pr-1")).toEqual([]);
    expect(issuesFromReview({ issues: [] }, "pr-1")).toEqual([]);
  });

  it("maps a partial streamed issue into the card shape", () => {
    const [issue] = issuesFromReview(
      {
        issues: [
          {
            severity: "high",
            title: "Stale closure in effect",
            file: "src/app/page.tsx",
            startLine: 42,
            quote: "setCount(count + 1)",
            why: "count is captured once",
            fix: "use a ref",
          },
        ],
      },
      "pr-4821",
    );

    expect(issue).toEqual({
      id: "pr-4821-0",
      severity: "high",
      title: "Stale closure in effect",
      file: "src/app/page.tsx",
      line: null,
      reportedLine: 42,
      anchor: "none",
      quote: "setCount(count + 1)",
      why: "count is captured once",
      fix: "use a ref",
    });
  });

  it("skips issues whose title has not streamed in yet", () => {
    const issues = issuesFromReview(
      { issues: [{ severity: "high" }, { title: "Real issue", startLine: 3 }] },
      "pr-1",
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.title).toBe("Real issue");
  });

  it("defaults missing fields instead of emitting undefined", () => {
    const [issue] = issuesFromReview({ issues: [{ title: "x" }] }, "pr-1");

    expect(issue).toMatchObject({ severity: "low", file: "", reportedLine: 1, why: "", fix: "" });
    expect(issue).not.toHaveProperty("endLine");
  });

  it("namespaces ids by the given prefix", () => {
    const [issue] = issuesFromReview({ issues: [{ title: "x" }] }, "a/b#1@sha");

    expect(issue?.id).toBe("a/b#1@sha-0");
  });
});

describe("matchDiffFile", () => {
  const files = [file("src/app/page.tsx", [1]), file("src/app/MyPage.tsx", [1])];

  it("matches a suffix only on a path boundary", () => {
    expect(matchDiffFile("app/page.tsx", files)?.path).toBe("src/app/page.tsx");
    expect(matchDiffFile("Page.tsx", files)).toBeNull();
  });

  it("ignores a leading ./", () => {
    expect(matchDiffFile("./src/app/page.tsx", files)?.path).toBe("src/app/page.tsx");
  });
});

describe("anchorReviewLines", () => {
  const files = [file("src/app/page.tsx", [10, 11, 12, 40, 41, 42]), file("src/lib/useUser.ts", [1, 2, 3])];

  it("marks an existing line with matching quote as exact", () => {
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "src/app/page.tsx", startLine: 11, quote: "line 11" }] },
      files,
      "p",
    );

    expect(issue).toMatchObject({ file: "src/app/page.tsx", line: 11, anchor: "exact" });
  });

  it("follows the quote when the reported number is off", () => {
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "src/app/page.tsx", startLine: 12, quote: "line 41" }] },
      files,
      "p",
    );

    expect(issue).toMatchObject({ line: 41, reportedLine: 12, anchor: "exact" });
  });

  it("snaps an unknown line to the nearest rendered line and says so", () => {
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "src/app/page.tsx", startLine: 30, quote: "nowhere" }] },
      files,
      "p",
    );

    expect(issue).toMatchObject({ line: 40, reportedLine: 30, anchor: "approx" });
  });

  it("treats a quote mismatch on an existing line as approximate", () => {
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "src/app/page.tsx", startLine: 11, quote: "something else" }] },
      files,
      "p",
    );

    expect(issue).toMatchObject({ line: 11, anchor: "approx" });
  });

  it("resolves a suffixed path to the diff file", () => {
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "useUser.ts", startLine: 2 }] },
      files,
      "p",
    );

    expect(issue).toMatchObject({ file: "src/lib/useUser.ts", line: 2, anchor: "exact" });
  });

  it("leaves an issue on an unrelated file unanchored", () => {
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "README.md", startLine: 2 }] },
      files,
      "p",
    );

    expect(issue).toMatchObject({ line: null, anchor: "none", reportedLine: 2 });
  });

  it("never anchors to a deleted line or a hunk header", () => {
    const withDeletes: FileDiff = {
      path: "a.ts",
      additions: 1,
      deletions: 1,
      scope: "full",
      lines: [
        { type: "hunk", content: "@@ -1,1 +1,1 @@", severity: null, issueId: null },
        { type: "del", oldNo: 1, content: "old", severity: null, issueId: null },
        { type: "add", newNo: 1, content: "new", severity: null, issueId: null },
      ],
    };
    const [issue] = anchorReviewLines(
      { issues: [{ title: "x", file: "a.ts", startLine: 1, quote: "old" }] },
      [withDeletes],
      "p",
    );

    expect(issue).toMatchObject({ line: 1, anchor: "approx" });
  });
});

describe("annotateDiffWithIssues", () => {
  const diffs = [file("src/app/page.tsx", [10, 11, 12]), file("src/lib/useUser.ts", [1, 2, 3])];

  it("stamps the issue id, severity, and title onto the matching rendered line", () => {
    const issues = anchorReviewLines(
      { issues: [{ severity: "high", title: "x", file: "src/app/page.tsx", startLine: 11 }] },
      diffs,
      "p",
    );

    const result = annotateDiffWithIssues(diffs, issues);
    const hit = result.find((f) => f.path === "src/app/page.tsx")!.lines.find((l) => l.newNo === 11)!;

    expect(hit).toMatchObject({ issueId: issues[0]!.id, severity: "high", issueTitle: "x" });
  });

  it("leaves unrelated lines and files untouched", () => {
    const issues = anchorReviewLines(
      { issues: [{ title: "x", file: "src/app/page.tsx", startLine: 11 }] },
      diffs,
      "p",
    );

    const result = annotateDiffWithIssues(diffs, issues);
    const other = result.find((f) => f.path === "src/lib/useUser.ts")!;

    expect(other).toBe(diffs[1]);
    expect(result[0]!.lines.filter((l) => l.issueId !== null)).toHaveLength(1);
  });

  it("prefers the higher severity when two issues share a line", () => {
    const issues = anchorReviewLines(
      {
        issues: [
          { severity: "low", title: "low", file: "src/app/page.tsx", startLine: 11 },
          { severity: "high", title: "high", file: "src/app/page.tsx", startLine: 11 },
        ],
      },
      diffs,
      "p",
    );

    const hit = annotateDiffWithIssues(diffs, issues)[0]!.lines.find((l) => l.newNo === 11)!;

    expect(hit.severity).toBe("high");
  });

  it("does not stamp unanchored issues", () => {
    const issues = anchorReviewLines({ issues: [{ title: "x", file: "nope.ts", startLine: 1 }] }, diffs, "p");

    expect(annotateDiffWithIssues(diffs, issues)).toEqual(diffs);
  });

  it("returns the input unchanged when there are no issues", () => {
    expect(annotateDiffWithIssues(diffs, [])).toBe(diffs);
  });
});

describe("countBySeverity / reviewCoverage", () => {
  it("counts issues per severity", () => {
    const issues = anchorReviewLines(
      { issues: [{ title: "a", severity: "high" }, { title: "b", severity: "high" }, { title: "c" }] },
      [],
      "p",
    );

    expect(countBySeverity(issues)).toEqual({ high: 2, medium: 0, low: 1 });
  });

  it("summarises which files were reviewed", () => {
    const coverage = reviewCoverage([
      file("a", [1]),
      file("b", [1], "truncated"),
      file("c", [1], "over-limit"),
      file("d", [], "no-patch"),
    ]);

    expect(coverage).toEqual({ reviewed: 2, total: 4, truncated: 1, overLimit: 1, noPatch: 1 });
  });
});
