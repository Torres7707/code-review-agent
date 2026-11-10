import type { FileDiff, ReviewScope } from "@/lib/types";

export type GitHubFilePatch = {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
};

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/**
 * Parse a unified diff patch (as returned by the GitHub "list PR files" API)
 * into per-line records that DiffView can render. Hunk headers are kept as
 * their own rows so the viewer can show where unchanged code was elided.
 * Line numbers map to the *new* file because review issues are anchored there.
 */
export function parsePatch(patch: string): FileDiff["lines"] {
  const out: FileDiff["lines"] = [];
  let oldNo = 0;
  let newNo = 0;
  let inHunk = false;

  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      const m = HUNK_HEADER.exec(line);
      if (m) {
        oldNo = Number.parseInt(m[1], 10);
        newNo = Number.parseInt(m[2], 10);
        inHunk = true;
        out.push({ type: "hunk", content: line, severity: null, issueId: null });
      }
      continue;
    }
    if (!inHunk) continue;

    // "\ No newline at end of file" and any malformed marker are not content.
    if (line.length === 0 || line[0] === "\\") continue;

    const marker = line[0];
    if (marker === "+") {
      out.push({ type: "add", newNo, content: line.slice(1), severity: null, issueId: null });
      newNo += 1;
    } else if (marker === "-") {
      out.push({ type: "del", oldNo, content: line.slice(1), severity: null, issueId: null });
      oldNo += 1;
    } else if (marker === " ") {
      out.push({ type: "context", oldNo, newNo, content: line.slice(1), severity: null, issueId: null });
      oldNo += 1;
      newNo += 1;
    }
    // Anything else (binary markers, etc.) is ignored.
  }

  return out;
}

/**
 * Converts GitHub's file list into rendered diffs. Files without a patch are
 * kept (with no lines) so the viewer can say they exist but cannot be shown.
 * `scopes[i]` says whether file `i` was sent to the reviewer.
 */
export function toFileDiffs(files: GitHubFilePatch[], scopes?: ReviewScope[]): FileDiff[] {
  return files.map((f, i) => {
    const hasPatch = typeof f.patch === "string" && f.patch.length > 0;
    return {
      path: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      lines: hasPatch ? parsePatch(f.patch!) : [],
      scope: scopes?.[i] ?? (hasPatch ? "full" : "no-patch"),
    };
  });
}
