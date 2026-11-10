import { parsePatch, type GitHubFilePatch } from "@/lib/diff";
import type { DiffLine, FileDiff, Issue, ReviewScope, Severity } from "@/lib/types";

export const MAX_REVIEW_FILES = 12;
export const MAX_PATCH_CHARS = 8000;

export type ReviewFileInput = {
  path: string;
  additions: number;
  deletions: number;
  patch: string;
};

export type ReviewInput = {
  pr: { number: number; title: string; branch: string };
  files: ReviewFileInput[];
};

/**
 * Cuts a patch to at most MAX_PATCH_CHARS, always on a line boundary so the
 * model never sees half a line.
 */
export function trimPatch(patch: string): { patch: string; truncated: boolean } {
  if (patch.length <= MAX_PATCH_CHARS) return { patch, truncated: false };
  const cut = patch.lastIndexOf("\n", MAX_PATCH_CHARS);
  return { patch: patch.slice(0, cut > 0 ? cut : MAX_PATCH_CHARS), truncated: true };
}

export type PlannedFile = { scope: ReviewScope; patch?: string };

/**
 * Decides which files the reviewer sees. The diff route and the review route
 * both call this so the UI can say exactly which files were (not) reviewed.
 */
export function planReview(files: GitHubFilePatch[]): PlannedFile[] {
  let taken = 0;
  return files.map((f) => {
    if (!f.patch) return { scope: "no-patch" };
    if (taken >= MAX_REVIEW_FILES) return { scope: "over-limit" };
    taken += 1;
    const trimmed = trimPatch(f.patch);
    return { scope: trimmed.truncated ? "truncated" : "full", patch: trimmed.patch };
  });
}

/**
 * Renders a patch with the new-file line number written in front of every
 * line, so the model copies line numbers instead of computing them from hunk
 * headers (which it gets wrong often enough to matter).
 *
 *   @@ -20,3 +20,4 @@
 *     20   unchanged line
 *        - removed line
 *     21 + added line
 */
export function numberPatch(patch: string): string {
  return parsePatch(patch)
    .map((l) => {
      if (l.type === "hunk") return l.content;
      const no = l.type === "del" ? "" : String(l.newNo);
      const marker = l.type === "add" ? "+" : l.type === "del" ? "-" : " ";
      return `${no.padStart(5)} ${marker} ${l.content}`;
    })
    .join("\n");
}

/** The user turn sent to the model. System instructions live in lib/prompt.ts. */
export function buildReviewPrompt(input: ReviewInput): string {
  const { pr, files } = input;
  const parts: string[] = [
    `<pull_request number="${pr.number}" branch="${escapeAttr(pr.branch)}">`,
    `<title>${escapeAttr(pr.title)}</title>`,
  ];

  if (files.length === 0) {
    parts.push("(This pull request has no reviewable text changes.)");
  }
  for (const f of files) {
    parts.push(
      `<file path="${escapeAttr(f.path)}" additions="${f.additions}" deletions="${f.deletions}">`,
      numberPatch(f.patch),
      "</file>",
    );
  }
  parts.push("</pull_request>");
  return parts.join("\n");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export type PartialReviewIssue = {
  severity?: Severity;
  title?: string;
  file?: string;
  startLine?: number;
  endLine?: number | null;
  quote?: string;
  why?: string;
  fix?: string;
};

export type PartialReview = {
  summary?: string;
  issues?: Array<PartialReviewIssue | undefined>;
};

export function matchDiffFile(file: string | undefined, files: FileDiff[]): FileDiff | null {
  const target = (file ?? "").trim().replace(/^\.?\//, "");
  if (!target) return null;

  const exact = files.find((f) => f.path === target);
  if (exact) return exact;

  const suffix = files.filter(
    (f) => f.path.endsWith(`/${target}`) || target.endsWith(`/${f.path}`),
  );
  if (suffix.length > 0) {
    // Shortest path is the least ambiguous of the suffix matches.
    return [...suffix].sort((a, b) => a.path.length - b.path.length)[0]!;
  }

  const base = target.split("/").pop();
  const baseNameMatches = files.filter((f) => f.path.split("/").pop() === base);
  return baseNameMatches.length === 1 ? baseNameMatches[0]! : null;
}

function normalize(code: string): string {
  return code.replace(/\s+/g, " ").trim();
}

function nearest<T extends { newNo: number }>(target: number, candidates: T[]): T {
  let best = candidates[0]!;
  for (const c of candidates) {
    if (Math.abs(target - c.newNo) < Math.abs(target - best.newNo)) best = c;
  }
  return best;
}

/** Adapts the partially streamed review object to the Issue card shape. */
export function issuesFromReview(
  review: PartialReview | null | undefined,
  idPrefix: string,
): Array<Issue & { quote: string }> {
  if (!review?.issues) return [];
  return review.issues.flatMap((item, idx) => {
    if (!item) return [];
    const title = item.title ?? "";
    if (title.trim().length === 0) return [];
    const reportedLine = item.startLine ?? 1;
    const issue: Issue & { quote: string } = {
      id: `${idPrefix}-${idx}`,
      severity: item.severity ?? "low",
      title,
      file: item.file ?? "",
      line: null,
      reportedLine,
      anchor: "none",
      why: item.why ?? "",
      fix: item.fix ?? "",
      quote: item.quote ?? "",
    };
    if (typeof item.endLine === "number") issue.endLine = item.endLine;
    return [issue];
  });
}

/**
 * Ties each issue to a line DiffView renders.
 *
 * 1. Resolve the file path (exact, then suffix, then unique basename).
 * 2. If the model's quote matches the code on the reported line, it is exact.
 * 3. Otherwise look for the quote elsewhere in the file (nearest match wins).
 * 4. Otherwise fall back to the nearest rendered line and mark it approximate,
 *    so the card can say the location is a guess instead of hiding it.
 */
export function anchorReviewLines(
  review: PartialReview | null | undefined,
  files: FileDiff[],
  idPrefix: string,
): Issue[] {
  return issuesFromReview(review, idPrefix).map(({ quote, ...issue }) => {
    const match = matchDiffFile(issue.file, files);
    if (!match) return issue;

    const rendered = match.lines.filter(
      (l): l is DiffLine & { newNo: number } => l.type !== "del" && typeof l.newNo === "number",
    );
    if (rendered.length === 0) return { ...issue, file: match.path };

    const q = normalize(quote);
    const matchesQuote = (content: string) => q.length > 0 && normalize(content).includes(q);
    const onReported = rendered.find((l) => l.newNo === issue.reportedLine);

    if (onReported && (q.length === 0 || matchesQuote(onReported.content))) {
      return { ...issue, file: match.path, line: onReported.newNo, anchor: "exact" as const };
    }

    const quoted = rendered.filter((l) => matchesQuote(l.content));
    if (quoted.length > 0) {
      const best = nearest(issue.reportedLine, quoted);
      return { ...issue, file: match.path, line: best.newNo, anchor: "exact" as const };
    }

    const best = onReported ?? nearest(issue.reportedLine, rendered);
    return { ...issue, file: match.path, line: best.newNo, anchor: "approx" as const };
  });
}

const SEVERITY_WEIGHT: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

/**
 * DiffView only knows how to highlight a line when the line itself carries an
 * `issueId`; the diff payload from GitHub never does. Stamp each issue onto the
 * rendered line it anchors to so clicking a card (or a line) has something to
 * match on both sides. A line can only map to one card; the most severe wins.
 */
export function annotateDiffWithIssues(files: FileDiff[], issues: Issue[]): FileDiff[] {
  if (files.length === 0 || issues.length === 0) return files;

  const byFile = new Map<string, Map<number, Issue>>();
  for (const issue of issues) {
    if (issue.line === null) continue;
    const lines = byFile.get(issue.file) ?? new Map<number, Issue>();
    const current = lines.get(issue.line);
    if (!current || SEVERITY_WEIGHT[issue.severity] > SEVERITY_WEIGHT[current.severity]) {
      lines.set(issue.line, issue);
    }
    byFile.set(issue.file, lines);
  }

  return files.map((file) => {
    const lines = byFile.get(file.path);
    if (!lines) return file;
    return {
      ...file,
      lines: file.lines.map((line) => {
        if (line.type === "del" || line.type === "hunk" || line.newNo === undefined) return line;
        const hit = lines.get(line.newNo);
        return hit
          ? { ...line, issueId: hit.id, severity: hit.severity, issueTitle: hit.title }
          : line;
      }),
    };
  });
}

export function countBySeverity(issues: Issue[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const issue of issues) counts[issue.severity] += 1;
  return counts;
}

export type ReviewCoverage = {
  reviewed: number;
  total: number;
  truncated: number;
  overLimit: number;
  noPatch: number;
};

export function reviewCoverage(files: FileDiff[]): ReviewCoverage {
  const coverage: ReviewCoverage = { reviewed: 0, total: files.length, truncated: 0, overLimit: 0, noPatch: 0 };
  for (const f of files) {
    if (f.scope === "full" || f.scope === "truncated") coverage.reviewed += 1;
    if (f.scope === "truncated") coverage.truncated += 1;
    if (f.scope === "over-limit") coverage.overLimit += 1;
    if (f.scope === "no-patch") coverage.noPatch += 1;
  }
  return coverage;
}
