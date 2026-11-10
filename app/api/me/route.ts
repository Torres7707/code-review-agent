import { readSession } from "@/lib/github-auth";

export type GitHubUser = { login: string; avatar_url: string };

export async function GET(req: Request) {
  const token = await readSession(req);
  if (!token) return Response.json({ user: null });

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ user: null });
    const u = (await res.json()) as { login?: string; avatar_url?: string };
    if (!u.login || !u.avatar_url) return Response.json({ user: null });
    return Response.json({ user: { login: u.login, avatar_url: u.avatar_url } });
  } catch {
    // Network failure is "unknown session", not "no answer" — the client
    // would otherwise hang on the loading state.
    return Response.json({ user: null });
  }
}
