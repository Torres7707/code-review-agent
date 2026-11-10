// Session cookie: the GitHub access token, encrypted with AES-GCM.
// Single-user tool, no database: the cookie is the session store. Encryption
// keeps the token unreadable if the cookie leaks (logs, a copied header, a
// shared machine); GCM's authentication tag also rejects any tampering.
export const SESSION_COOKIE = "cra_session";
export const OAUTH_STATE_COOKIE = "cra_oauth_state";

const SESSION_VERSION = "v1";

export function githubClientId(): string {
  return process.env.GITHUB_CLIENT_ID ?? "";
}

export function githubClientSecret(): string {
  return process.env.GITHUB_CLIENT_SECRET ?? "";
}

export function getGitHubRedirectUri(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}/api/auth/callback`;
}

function secureSuffix(): string {
  // Secure is required over HTTPS; localhost dev is plain HTTP.
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function sessionCookieHeader(sealedToken: string, maxAge = 2592000): string {
  return `${SESSION_COOKIE}=${sealedToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureSuffix()}`;
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

export function readCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim() || null;
  }
  return null;
}

/**
 * SESSION_SECRET is required in production so the cookie key can be rotated
 * independently of the OAuth client secret. Local development falls back to
 * the client secret to keep setup short.
 */
function secret(): string {
  const dedicated = process.env.SESSION_SECRET;
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  const fallback = githubClientSecret();
  if (!fallback) throw new Error("SESSION_SECRET or GITHUB_CLIENT_SECRET must be set");
  return fallback;
}

async function sessionKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret()));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/** Encrypts the access token into a cookie-safe string. */
export async function sealSession(token: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await sessionKey(),
    new TextEncoder().encode(token),
  );
  return [
    SESSION_VERSION,
    Buffer.from(iv).toString("base64url"),
    Buffer.from(ciphertext).toString("base64url"),
  ].join(".");
}

/** Returns the access token from the session cookie, or null if absent or invalid. */
export async function readSession(req: Request): Promise<string | null> {
  const value = readCookie(req, SESSION_COOKIE);
  if (!value) return null;
  const [version, ivPart, dataPart, ...rest] = value.split(".");
  if (version !== SESSION_VERSION || !ivPart || !dataPart || rest.length > 0) return null;

  const key = await sessionKey();
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Buffer.from(ivPart, "base64url") },
      key,
      Buffer.from(dataPart, "base64url"),
    );
    const token = new TextDecoder().decode(plaintext);
    return token || null;
  } catch {
    // Wrong key, tampered value, or an old-format cookie.
    return null;
  }
}

/**
 * Revokes the token at GitHub so signing out actually ends access, not just
 * the local cookie. Best effort: a failure here must not block sign-out.
 */
export async function revokeGitHubToken(token: string): Promise<void> {
  const clientId = githubClientId();
  const clientSecret = githubClientSecret();
  if (!clientId || !clientSecret) return;
  try {
    const res = await fetch(`https://api.github.com/applications/${encodeURIComponent(clientId)}/token`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    });
    if (!res.ok && res.status !== 404) {
      console.error("GitHub token revocation failed:", res.status);
    }
  } catch (error) {
    console.error("GitHub token revocation failed:", error);
  }
}
