import {
  OAUTH_STATE_COOKIE,
  clearStateCookieHeader,
  getGitHubRedirectUri,
  githubClientId,
  githubClientSecret,
  readCookie,
  sealSession,
  sessionCookieHeader,
} from "@/lib/github-auth";

function redirectWith(location: string, cookies: string[]): Response {
  const headers = new Headers();
  headers.set("Location", location);
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}

async function exchangeCode(req: Request, code: string): Promise<string | null> {
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: githubClientId(),
        client_secret: githubClientSecret(),
        code,
        redirect_uri: getGitHubRedirectUri(req),
      }),
    });
    if (!res.ok) {
      console.error("GitHub OAuth token exchange failed with status", res.status);
      return null;
    }
    const json = (await res.json()) as { access_token?: string; error?: string };
    if (!json.access_token) {
      console.error("GitHub OAuth token exchange failed:", json.error);
      return null;
    }
    return json.access_token;
  } catch (error) {
    console.error("GitHub OAuth token exchange failed:", error);
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(req, OAUTH_STATE_COOKIE);
  const clearState = clearStateCookieHeader();

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWith("/?auth_error=state", [clearState]);
  }

  const token = await exchangeCode(req, code);
  if (!token) return redirectWith("/?auth_error=exchange", [clearState]);

  return redirectWith("/", [clearState, sessionCookieHeader(await sealSession(token))]);
}
