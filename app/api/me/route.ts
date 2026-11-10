import { readSession } from "@/lib/github-auth";
import { githubJson } from "@/lib/github";
import type { GitHubUser } from "@/lib/types";

export async function GET(req: Request) {
  const token = await readSession(req);
  if (!token) return Response.json({ user: null });

  // githubJson never throws: a network failure reads as "no session" instead
  // of leaving the client on the loading screen.
  const res = await githubJson<{ login?: string; avatar_url?: string }>(token, "/user");
  if (!res.ok || !res.data.login || !res.data.avatar_url) return Response.json({ user: null });

  const user: GitHubUser = { login: res.data.login, avatar_url: res.data.avatar_url };
  return Response.json({ user });
}
