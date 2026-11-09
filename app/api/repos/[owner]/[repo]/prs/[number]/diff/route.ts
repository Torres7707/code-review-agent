import { readSession } from "@/lib/github-auth";
import type { FileDiff } from "@/lib/mock";

type Params = { params: Promise<{ owner: string; repo: string; number: string }> };

type GitHubFile = {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
};

// Parse a unified diff patch into per-line records compatible with DiffView.
function parsePatch(patch: string) {
  const lines = patch.split("\n");
  const out: FileDiff["lines"] = [];
  let oldNo = 0;
  let newNo = 0;
  for (const line of lines) {
    if (line.startsWith("@@")) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldNo = parseInt(m[1], 10);
        newNo = parseInt(m[2], 10);
      }
      continue;
    }
    if (line.startsWith("+")) {
      out.push({ type: "add", newNo, content: line.slice(1), severity: null, issueId: null });
      newNo += 1;
    } else if (line.startsWith("-")) {
      out.push({ type: "del", oldNo, content: line.slice(1), severity: null, issueId: null });
      oldNo += 1;
    } else if (line.startsWith(" ") || line === "") {
      out.push({ type: "context", oldNo, newNo, content: line.slice(1), severity: null, issueId: null });
      oldNo += 1;
      newNo += 1;
    }
  }
  return out;
}

export async function GET(req: Request, { params }: Params) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo, number } = await params;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=20`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    },
  );
  if (!res.ok) {
    return Response.json({ error: `GitHub API ${res.status}` }, { status: res.status });
  }
  const files = (await res.json()) as GitHubFile[];
  const diffs = files
    .filter((f) => f.patch)
    .map((f) => ({
      path: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      lines: parsePatch(f.patch ?? ""),
    }) satisfies FileDiff);
  return Response.json({ diffs });
}
