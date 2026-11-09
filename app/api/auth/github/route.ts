import {
  GITHUB_CLIENT_ID,
  getGitHubRedirectUri,
  stateCookieHeader,
} from "@/lib/github-auth";

export async function GET(req: Request) {
  if (!GITHUB_CLIENT_ID) {
    return Response.json(
      { error: "GITHUB_CLIENT_ID not configured. Add it to .env.local." },
      { status: 500 },
    );
  }

  const state = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)).buffer,
  ).toString("base64url");

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", getGitHubRedirectUri(req));
  authorizeUrl.searchParams.set("scope", "repo read:user");
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": stateCookieHeader(state),
    },
  });
}
