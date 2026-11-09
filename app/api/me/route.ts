import { readSession } from "@/lib/github-auth";

export type GitHubUser = { login: string; avatar_url: string };

export async function GET(req: Request) {
  const token = await readSession(req);
  if (!token) return Response.json({ user: null });

  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return Response.json({ user: null });
  const u = await res.json();
  return Response.json({ user: { login: u.login, avatar_url: u.avatar_url } satisfies GitHubUser });
}
