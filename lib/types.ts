export type Severity = "high" | "medium" | "low";

/**
 * How confidently an issue is tied to a rendered diff line.
 * - exact:  the reported line exists in the diff and its code matches the quote
 * - approx: the reported line was missing or did not match; we picked the nearest line
 * - none:   the issue points at a file or line that is not in the diff
 */
export type AnchorQuality = "exact" | "approx" | "none";

export type Issue = {
  id: string;
  severity: Severity;
  title: string;
  file: string;
  /** The diff line (new-file number) this card highlights, or null when unanchored. */
  line: number | null;
  /** The line number the model reported. */
  reportedLine: number;
  endLine?: number;
  anchor: AnchorQuality;
  why: string;
  fix: string;
};

export type Repo = {
  id: string;
  owner: string;
  name: string;
  language: string | null;
  stars: number;
  updatedAt: string;
};

export type PR = {
  id: string;
  number: number;
  title: string;
  author: string;
  updatedAt: string;
  branch: string;
};

/** PR details returned together with its diff. */
export type PRDetail = {
  number: number;
  title: string;
  author: string;
  branch: string;
  headSha: string;
  htmlUrl: string;
  additions: number;
  deletions: number;
  filesChanged: number;
};

export type DiffLine = {
  type: "context" | "add" | "del" | "hunk";
  oldNo?: number;
  newNo?: number;
  content: string;
  severity: Severity | null;
  issueId: string | null;
  issueTitle?: string;
};

/**
 * Whether the reviewer saw this file.
 * - full:       the whole patch was sent to the model
 * - truncated:  only the first part of the patch was sent
 * - over-limit: not sent; the PR has more reviewable files than the limit
 * - no-patch:   GitHub returned no patch (binary, too large, or a pure rename)
 */
export type ReviewScope = "full" | "truncated" | "over-limit" | "no-patch";

export type FileDiff = {
  path: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  scope: ReviewScope;
};

export type GitHubUser = { login: string; avatar_url: string };
