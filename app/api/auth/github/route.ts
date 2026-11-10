import { getGitHubRedirectUri, githubClientId, stateCookieHeader } from "@/lib/github-auth";

// OAuth Apps have no read-only scope for private repositories: `repo` is the
// smallest scope that can read private PRs, and it also grants write access.
// This app only ever issues GET requests with it. A GitHub App with
// "Pull requests: read" and "Contents: read" would be the least-privilege
// alternative. No `read:user` is requested: GET /user works without it.
const SCOPE = "repo";

export async function GET(req: Request) {
  const clientId = githubClientId();
  if (!clientId) {
    return Response.json(
      { error: "GITHUB_CLIENT_ID not configured. Add it to .env.local." },
      { status: 500 },
    );
  }

  const state = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getGitHubRedirectUri(req));
  authorizeUrl.searchParams.set("scope", SCOPE);
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": stateCookieHeader(state),
    },
  });
}
