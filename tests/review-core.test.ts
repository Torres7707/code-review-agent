import { describe, expect, it } from "vitest";
import { anchorReviewLines, annotateDiffWithIssues, issuesFromReview } from "@/lib/review-core";
import type { FileDiff } from "@/lib/types";

function file(path: string, newLineNumbers: number[]): FileDiff {
  return {
    path,
    additions: newLineNumbers.length,
    deletions: 0,
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
    const issues = issuesFromReview(
      {
        issues: [
          {
            severity: "high",
            title: "Stale closure in effect",
            file: "src/app/page.tsx",
            startLine: 42,
            why: "count is captured once",
            fix: "use a ref",
          },
        ],
      },
      "pr-4821",
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      id: "pr-4821-0",
      severity: "high",
      title: "Stale closure in effect",
      file: "src/app/page.tsx",
      startLine: 42,
      why: "count is captured once",
      fix: "use a ref",
      status: "open",
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

    expect(issue).toMatchObject({ severity: "low", file: "", startLine: 1, why: "", fix: "" });
    expect(issue).not.toHaveProperty("endLine");
  });

  it("stops assuming anything about the id prefix without one", () => {
    const [issue] = issuesFromReview({ issues: [{ title: "x" }] }, null);

    expect(issue?.id).toBe("review-0");
  });
});

describe("anchorReviewLines", () => {
  const files = [file("src/app/page.tsx", [10, 11, 12, 40, 41, 42]), file("src/lib/useUser.ts", [1, 2, 3])];

  it("keeps an exact file and line", () => {
    const [issue] = anchorReviewLines({ issues: [{ title: "x", file: "src/app/page.tsx", startLine: 11 }] }, files);

    expect(issue).toMatchObject({ file: "src/app/page.tsx", startLine: 11 });
  });

  it("snaps a changed-but-unshown line to the nearest rendered line", () => {
    const [issue] = anchorReviewLines({ issues: [{ title: "x", file: "src/app/page.tsx", startLine: 30 }] }, files);

    expect(issue?.startLine).toBe(40);
  });

  it("resolves a suffixed path to the diff file", () => {
    const [issue] = anchorReviewLines({ issues: [{ title: "x", file: "useUser.ts", startLine: 2 }] }, files);

    expect(issue).toMatchObject({ file: "src/lib/useUser.ts", startLine: 2 });
  });

  it("drops a line that points at an unrelated file", () => {
    const [issue] = anchorReviewLines({ issues: [{ title: "x", file: "README.md", startLine: 2 }] }, files);

    expect(issue).not.toHaveProperty("startLine");
  });

  it("leaves the issue untouched when there are no diffs", () => {
    const [issue] = anchorReviewLines({ issues: [{ title: "x", file: "a.ts", startLine: 5 }] }, []);

    expect(issue).toMatchObject({ file: "a.ts", startLine: 5 });
  });
});

describe("annotateDiffWithIssues", () => {
  const diffs = [file("src/app/page.tsx", [10, 11, 12]), file("src/lib/useUser.ts", [1, 2, 3])];

  it("stamps the issue id and severity onto the matching rendered line", () => {
    const issues = anchorReviewLines(
      { issues: [{ severity: "high", title: "x", file: "src/app/page.tsx", startLine: 11 }] },
      diffs,
    );

    const result = annotateDiffWithIssues(diffs, issues);
    const page = result.find((f) => f.path === "src/app/page.tsx")!;
    const hit = page.lines.find((l) => l.newNo === 11)!;

    expect(hit.issueId).toBe(issues[0]!.id);
    expect(hit.severity).toBe("high");
  });

  it("leaves unrelated lines and files untouched", () => {
    const issues = anchorReviewLines(
      { issues: [{ title: "x", file: "src/app/page.tsx", startLine: 11 }] },
      diffs,
    );

    const result = annotateDiffWithIssues(diffs, issues);
    const other = result.find((f) => f.path === "src/lib/useUser.ts")!;

    expect(other.lines.every((l) => l.issueId === null)).toBe(true);
    expect(result.filter((f) => f.path === "src/app/page.tsx")[0]!.lines.filter((l) => l.issueId !== null)).toHaveLength(1);
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
    );

    const result = annotateDiffWithIssues(diffs, issues);
    const hit = result
      .find((f) => f.path === "src/app/page.tsx")!
      .lines.find((l) => l.newNo === 11)!;

    expect(hit.severity).toBe("high");
  });

  it("returns the input unchanged when there are no issues", () => {
    expect(annotateDiffWithIssues(diffs, [])).toBe(diffs);
  });
});
