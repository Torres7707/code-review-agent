import { readSession } from "@/lib/github-auth";

export type RepoSummary = {
  id: string;
  owner: string;
  name: string;
  language: string | null;
  stars: number;
  updatedAt: string;
};

export async function GET(req: Request) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  // Authenticated user's own repos first — this is a single-user review tool.
  const res = await fetch("https://api.github.com/user/repos?sort=pushed&per_page=30&affiliation=owner,collaborator", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    return Response.json({ error: `GitHub API ${res.status}` }, { status: res.status });
  }
  const repos = (await res.json()) as Array<{
    id: number; name: string; owner: { login: string };
    language: string | null; stargazers_count: number; pushed_at: string;
  }>;
  return Response.json({
    repos: repos.map((r) => ({
      id: `${r.id}`,
      owner: r.owner.login,
      name: r.name,
      language: r.language,
      stars: r.stargazers_count,
      updatedAt: r.pushed_at,
    }) satisfies RepoSummary),
  });
}
