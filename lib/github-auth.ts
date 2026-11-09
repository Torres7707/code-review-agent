export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

// Session cookie: a signed (HMAC) bearer of the GitHub access token.
// Single-user local tool — no DB, just tamper-proof cookie storage.
export const SESSION_COOKIE = "cra_session";
export const OAUTH_STATE_COOKIE = "cra_oauth_state";

export function getGitHubRedirectUri(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}/api/auth/callback`;
}

function secureSuffix(): string {
  // Secure is required over HTTPS; localhost dev is plain HTTP.
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function sessionCookieHeader(signedToken: string, maxAge = 2592000): string {
  return `${SESSION_COOKIE}=${signedToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureSuffix()}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureSuffix()}`;
}

export function stateCookieHeader(state: string): string {
  return `${OAUTH_STATE_COOKIE}=${state}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=600${secureSuffix()}`;
}

export function clearStateCookieHeader(): string {
  return `${OAUTH_STATE_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0${secureSuffix()}`;
}

function readCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

function secret(): string {
  const s = process.env.SESSION_SECRET || GITHUB_CLIENT_SECRET;
  if (!s) throw new Error("SESSION_SECRET or GITHUB_CLIENT_SECRET must be set");
  return s;
}

async function hmacHex(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(token: string): Promise<string> {
  return `${Buffer.from(token).toString("base64url")}.${await hmacHex(token)}`;
}

export async function readSession(req: Request): Promise<string | null> {
  const value = readCookie(req, SESSION_COOKIE);
  if (!value) return null;
  const sep = value.lastIndexOf(".");
  if (sep <= 0) return null;
  const payload = value.slice(0, sep);
  const mac = value.slice(sep + 1);
  const token = Buffer.from(payload, "base64url").toString();
  if (!timingSafeEqual(mac, await hmacHex(token))) return null;
  return token;
}

export { readCookie };
