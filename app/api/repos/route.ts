import { readSession } from "@/lib/github-auth";
import { githubErrorResponse, githubJson } from "@/lib/github";
import type { Repo } from "@/lib/types";

type GitHubRepo = {
  id: number;
  name: string;
  owner: { login: string };
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
};

export async function GET(req: Request) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  // The user's own and collaborator repos, most recently pushed first.
  const result = await githubJson<GitHubRepo[]>(
    token,
    "/user/repos?sort=pushed&per_page=100&affiliation=owner,collaborator",
  );
  if (!result.ok) return githubErrorResponse(result.status);

  const repos: Repo[] = result.data.map((r) => ({
    id: `${r.id}`,
    owner: r.owner.login,
    name: r.name,
    language: r.language,
    stars: r.stargazers_count,
    updatedAt: r.pushed_at,
  }));
  return Response.json({ repos });
}
