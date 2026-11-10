import { readSession } from "@/lib/github-auth";
import { githubJson } from "@/lib/github";

type Params = { params: Promise<{ owner: string; repo: string; number: string }> };

export type PRMeta = {
  number: number;
  title: string;
  author: string;
  branch: string;
  state: string;
  additions: number;
  deletions: number;
  filesChanged: number;
  updatedAt: string;
  htmlUrl: string;
};

type GitHubPull = {
  number: number;
  title: string;
  state: string;
  html_url: string;
  updated_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
  user: { login: string } | null;
  head: { ref: string };
};

export async function GET(req: Request, { params }: Params) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo, number } = await params;
  if (!/^\d+$/.test(number)) {
    return Response.json({ error: "PR number must be numeric" }, { status: 400 });
  }

  const result = await githubJson<GitHubPull>(token, `/repos/${owner}/${repo}/pulls/${number}`);
  if (!result.ok) {
    return Response.json({ error: `GitHub API ${result.status}` }, { status: result.status });
  }

  const p = result.data;
  return Response.json({
    pr: {
      number: p.number,
      title: p.title,
      author: p.user?.login ?? "unknown",
      branch: p.head.ref,
      state: p.state,
      additions: p.additions,
      deletions: p.deletions,
      filesChanged: p.changed_files,
      updatedAt: p.updated_at,
      htmlUrl: p.html_url,
    } satisfies PRMeta,
  });
}
