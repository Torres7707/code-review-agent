import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DiffView } from "@/app/components/DiffView";
import type { FileDiff } from "@/lib/types";

const FILE: FileDiff = {
  path: "src/app/page.tsx",
  additions: 2,
  deletions: 0,
  scope: "full",
  lines: [
    { type: "hunk", content: "@@ -10,1 +10,3 @@ export function Page() {", severity: null, issueId: null },
    { type: "context", oldNo: 10, newNo: 10, content: "const a = 1;", severity: null, issueId: null },
    { type: "add", newNo: 11, content: "const b = 2;", severity: "high", issueId: "i-1", issueTitle: "Bug" },
    { type: "add", newNo: 12, content: "const c = 3;", severity: null, issueId: null },
  ],
};

function render(activeIssueId: string | null, file: FileDiff = FILE) {
  return renderToStaticMarkup(
    <DiffView files={[file]} activeIssueId={activeIssueId} onLineClick={() => {}} emptyMessage="" />,
  );
}

const flashing = (html: string) => html.match(/flash-sev/g)?.length ?? 0;

describe("DiffView", () => {
  it("highlights nothing when no issue is selected", () => {
    expect(flashing(render(null))).toBe(0);
  });

  it("highlights only the selected issue's line", () => {
    expect(flashing(render("i-1"))).toBe(1);
  });

  it("renders the real hunk header from the patch", () => {
    const html = render(null);
    expect(html).toContain("@@ -10,1 +10,3 @@ export function Page() {");
    expect(html).not.toContain("@@ -1,13 +1,13 @@");
  });

  it("makes only issue lines interactive", () => {
    expect(render(null).match(/role="button"/g)).toHaveLength(1);
  });

  it("explains files that were not reviewed or have no diff", () => {
    expect(render(null, { ...FILE, scope: "over-limit" })).toContain("Not reviewed");
    expect(render(null, { ...FILE, scope: "no-patch", lines: [] })).toContain("no diff to show");
  });
});
