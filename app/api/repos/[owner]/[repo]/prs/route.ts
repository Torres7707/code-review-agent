import { readSession } from "@/lib/github-auth";

export type PRSummary = {
  id: string;
  number: number;
  title: string;
  author: string;
  updatedAt: string;
  branch: string;
};

type Params = { params: Promise<{ owner: string; repo: string }> };

export async function GET(req: Request, { params }: Params) {
  const token = await readSession(req);
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { owner, repo } = await params;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=updated&per_page=20`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    },
  );
  if (!res.ok) {
    return Response.json({ error: `GitHub API ${res.status}` }, { status: res.status });
  }
  const pulls = (await res.json()) as Array<{
    id: number; number: number; title: string; updated_at: string;
    user: { login: string } | null; head: { ref: string };
  }>;
  return Response.json({
    prs: pulls.map((p) => ({
      id: `pr-${p.number}`,
      number: p.number,
      title: p.title,
      author: p.user?.login ?? "unknown",
      updatedAt: p.updated_at,
      branch: p.head.ref,
    }) satisfies PRSummary),
  });
}
