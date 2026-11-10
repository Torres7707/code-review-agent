import type { FileDiff, Issue } from "@/lib/types";

export type ReviewFileInput = {
  path: string;
  additions?: number;
  deletions?: number;
  patch?: string;
  lines?: string[];
};

export type ReviewInput = {
  pr?: { number?: number; title?: string; branch?: string };
  files?: ReviewFileInput[];
  /** Free-form code path, kept for the original "paste code" starter flow. */
  code?: string;
  language?: string;
};

export const MAX_REVIEW_FILES = 12;
export const MAX_PATCH_CHARS = 8000;

export function trimPatch(patch: string | undefined): string | undefined {
  if (!patch) return undefined;
  return patch.length > MAX_PATCH_CHARS
    ? `${patch.slice(0, MAX_PATCH_CHARS)}\n… (patch truncated)`
    : patch;
}

/** The user turn sent to the model. System instructions live in lib/prompt.ts. */
export function buildReviewPrompt(input: ReviewInput): string {
  if (input.code && input.code.trim().length > 0) {
    const lang = input.language ?? "React/TypeScript";
    return [
      `Review this ${lang} code from a pull request.`,
      "",
      "```",
      input.code,
      "```",
    ].join("\n");
  }

  const parts: string[] = [];
  const pr = input.pr;
  if (pr) {
    const label = pr.number !== undefined ? `Pull request #${pr.number}` : "Pull request";
    const branch = pr.branch ? `\nBranch: ${pr.branch}` : "";
    parts.push(`${label}: ${pr.title ?? "(untitled)"}${branch}`);
  }

  const files = input.files ?? [];
  if (files.length > 0) {
    parts.push("Changed files:");
    for (const f of files) {
      const diff = f.patch ?? (f.lines ? f.lines.join("\n") : "");
      parts.push(`\n--- ${f.path} (+${f.additions ?? 0} -${f.deletions ?? 0}) ---\n${diff}`);
    }
  }

  if (parts.length === 0) parts.push("(No code or diff was provided.)");

  return `# Input\n\n${parts.join("\n")}`;
}

export type PartialReviewIssue = {
  severity?: "high" | "medium" | "low";
  title?: string;
  file?: string;
  startLine?: number;
  endLine?: number | null;
  why?: string;
  fix?: string;
};

export type PartialReview = { issues?: Array<PartialReviewIssue | undefined> };

function matchDiffFile(file: string | undefined, files: FileDiff[]): FileDiff | null {
  const target = (file ?? "").trim();
  if (!target) return null;

  const exact = files.find((f) => f.path === target);
  if (exact) return exact;

  const suffix = files.filter(
    (f) => f.path.endsWith(target) || target.endsWith(f.path),
  );
  if (suffix.length === 1) return suffix[0]!;
  if (suffix.length > 1) {
    // Shortest path is the least ambiguous of the suffix matches.
    return suffix.sort((a, b) => a.path.length - b.path.length)[0]!;
  }

  const baseNameMatches = files.filter(
    (f) => f.path.split("/").pop() === target.split("/").pop(),
  );
  return baseNameMatches.length === 1 ? baseNameMatches[0]! : null;
}

/**
 * Maps model-reported new-file line numbers onto lines DiffView renders.
 * Lines absent from the diff (unchanged code, dropped context) are snapped to
 * the nearest hunk line in the same file instead of silently not highlighting.
 */
export function anchorReviewLines(
  review: PartialReview | null | undefined,
  files: FileDiff[],
): Issue[] {
  const issues = issuesFromReview(review, null);
  if (files.length === 0) return issues;

  const renderedByFile = new Map(
    files.map((f) => [
      f.path,
      f.lines
        .map((l) => l.newNo)
        .filter((n): n is number => typeof n === "number"),
    ]),
  );

  for (const issue of issues) {
    const match = matchDiffFile(issue.file, files);
    if (!match) {
      delete (issue as Partial<Issue>).startLine;
      continue;
    }

    const rendered = renderedByFile.get(match.path) ?? [];
    if (rendered.length === 0) {
      delete (issue as Partial<Issue>).startLine;
      continue;
    }

    issue.file = match.path;
    if (!rendered.includes(issue.startLine)) {
      issue.startLine = nearest(issue.startLine, rendered);
    }
  }

  return issues;
}

function nearest(target: number, candidates: number[]): number {
  let best = candidates[0]!;
  let bestDistance = Math.abs(target - best);
  for (const candidate of candidates) {
    const distance = Math.abs(target - candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * DiffView only knows how to highlight a line when the line itself carries an
 * `issueId`; the diff payload from GitHub never does. Stamp each issue onto the
 * rendered line it anchors to so clicking a card (or a line) has something to
 * match on both sides.
 */
export function annotateDiffWithIssues(files: FileDiff[], issues: Issue[]): FileDiff[] {
  if (files.length === 0 || issues.length === 0) return files;

  const byFile = new Map<string, Issue[]>();
  for (const issue of issues) {
    const match = matchDiffFile(issue.file, files);
    if (!match) continue;
    const list = byFile.get(match.path) ?? [];
    list.push(issue);
    byFile.set(match.path, list);
  }

  return files.map((file) => {
    const fileIssues = byFile.get(file.path);
    if (!fileIssues || fileIssues.length === 0) return file;

    const lines = file.lines.map((line) => {
      // A line can only map to one card; prefer the most severe.
      const hit = fileIssues
        .filter((issue) => issue.startLine === line.newNo)
        .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))[0];
      return hit
        ? { ...line, issueId: hit.id, severity: hit.severity }
        : line;
    });

    return { ...file, lines };
  });
}

function severityWeight(severity: Issue["severity"]): number {
  return severity === "high" ? 3 : severity === "medium" ? 2 : 1;
}

/** Adapts the partially streamed review object to the Issue card shape. */
export function issuesFromReview(
  review: PartialReview | null | undefined,
  prId: string | null,
): Issue[] {
  if (!review?.issues) return [];
  return review.issues.flatMap((item, idx) => {
    if (!item) return [];
    const title = item.title ?? "";
    if (title.trim().length === 0) return [];
    const issue: Issue = {
      id: `${prId ?? "review"}-${idx}`,
      severity: item.severity ?? "low",
      title,
      file: item.file ?? "",
      startLine: item.startLine ?? 1,
      why: item.why ?? "",
      fix: item.fix ?? "",
      status: "open",
    };
    if (item.endLine !== undefined && item.endLine !== null) issue.endLine = item.endLine;
    return [issue];
  });
}
