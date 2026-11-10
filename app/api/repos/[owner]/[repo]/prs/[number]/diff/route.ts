import { readSession } from "@/lib/github-auth";
import { githubJson } from "@/lib/github";
import { toFileDiffs, type GitHubFilePatch } from "@/lib/diff";

type Params = { params: Promise<{ owner: string; repo: string; number: string }> };

export async function GET(req: Request, { params }: Params) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo, number } = await params;
  if (!/^\d+$/.test(number)) {
    return Response.json({ error: "PR number must be numeric" }, { status: 400 });
  }

  const files = await githubJson<GitHubFilePatch[]>(
    token,
    `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
  );
  if (!files.ok) {
    return Response.json({ error: `GitHub API ${files.status}` }, { status: files.status });
  }

  return Response.json({ diffs: toFileDiffs(files.data) });
}
