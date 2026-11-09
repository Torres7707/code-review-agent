import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  OAUTH_STATE_COOKIE,
  clearStateCookieHeader,
  readCookie,
  sessionCookieHeader,
  signSession,
} from "@/lib/github-auth";

function redirectWith(location: string, cookies: string[]): Response {
  const headers = new Headers();
  headers.set("Location", location);
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(req, OAUTH_STATE_COOKIE);
  const clearState = clearStateCookieHeader();

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWith("/?auth_error=1", [clearState]);
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.protocol}//${url.host}/api/auth/callback`,
    }),
  });
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error_description?: string;
  };
  if (!tokenJson.access_token) {
    console.error("GitHub OAuth token exchange failed:", tokenJson.error_description);
    return redirectWith("/?auth_error=1", [clearState]);
  }

  const signed = await signSession(tokenJson.access_token);
  return redirectWith("/", [clearState, sessionCookieHeader(signed)]);
}
