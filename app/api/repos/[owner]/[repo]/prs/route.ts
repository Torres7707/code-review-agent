import { readSession } from "@/lib/github-auth";
import {
  githubErrorResponse,
  githubJson,
  invalidRepoResponse,
  repoPath,
  type GitHubPull,
} from "@/lib/github";
import type { PR } from "@/lib/types";

export async function GET(req: Request, ctx: RouteContext<"/api/repos/[owner]/[repo]/prs">) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo } = await ctx.params;
  const invalid = invalidRepoResponse(owner, repo);
  if (invalid) return invalid;

  const result = await githubJson<GitHubPull[]>(
    token,
    `${repoPath(owner, repo)}/pulls?state=open&sort=updated&direction=desc&per_page=30`,
  );
  if (!result.ok) return githubErrorResponse(result.status);

  const prs: PR[] = result.data.map((p) => ({
    id: `pr-${p.number}`,
    number: p.number,
    title: p.title,
    author: p.user?.login ?? "unknown",
    updatedAt: p.updated_at,
    branch: p.head.ref,
  }));
  return Response.json({ prs });
}
