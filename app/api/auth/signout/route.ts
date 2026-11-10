import { clearSessionCookieHeader, readSession, revokeGitHubToken } from "@/lib/github-auth";

export async function POST(req: Request) {
  const token = await readSession(req);
  if (token) await revokeGitHubToken(token);
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": clearSessionCookieHeader() },
  });
}
