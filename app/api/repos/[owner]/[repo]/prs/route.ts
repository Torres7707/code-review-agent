import { readSession } from "@/lib/github-auth";
import { githubJson } from "@/lib/github";

export type PRSummary = {
  id: string;
  number: number;
  title: string;
  author: string;
  updatedAt: string;
  branch: string;
};

type Params = { params: Promise<{ owner: string; repo: string }> };

type GitHubPull = {
  number: number;
  title: string;
  updated_at: string;
  user: { login: string } | null;
  head: { ref: string };
};

export async function GET(req: Request, { params }: Params) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo } = await params;
  const result = await githubJson<GitHubPull[]>(
    token,
    `/repos/${owner}/${repo}/pulls?state=open&sort=updated&direction=desc&per_page=30`,
  );
  if (!result.ok) {
    return Response.json({ error: `GitHub API ${result.status}` }, { status: result.status });
  }

  const prs = result.data.map((p) => ({
    id: `pr-${p.number}`,
    number: p.number,
    title: p.title,
    author: p.user?.login ?? "unknown",
    updatedAt: p.updated_at,
    branch: p.head.ref,
  }));

  return Response.json({ prs });
}
