import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE,
  clearSessionCookieHeader,
  readSession,
  sessionCookieHeader,
  sealSession,
} from "@/lib/github-auth";

function cookieRequest(cookie: string): Request {
  return new Request("http://localhost/api/me", { headers: { cookie } });
}

beforeEach(() => {
  vi.stubEnv("GITHUB_CLIENT_ID", "test-client");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "test-secret");
  vi.stubEnv("SESSION_SECRET", "test-session-secret");
  vi.stubEnv("NODE_ENV", "test");
});

describe("sealSession / readSession", () => {
  it("round-trips a GitHub access token", async () => {
    const token = "gho_1234567890abcdef";
    const signed = await sealSession(token);

    expect(signed).not.toContain(token);
    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=${signed}`))).resolves.toBe(token);
  });

  it("rejects a missing cookie", async () => {
    await expect(readSession(cookieRequest(""))).resolves.toBeNull();
  });

  it("rejects a cookie that was never sealed", async () => {
    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=gho_plain`))).resolves.toBeNull();
  });

  it("rejects a tampered token", async () => {
    const sealed = await sealSession("gho_original");
    const [version, iv, data] = sealed.split(".");
    const bytes = Buffer.from(data!, "base64url");
    bytes[0] = bytes[0]! ^ 0xff;
    const forged = [version, iv, bytes.toString("base64url")].join(".");

    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=${forged}`))).resolves.toBeNull();
  });

  it("does not expose the token in the cookie value", async () => {
    const sealed = await sealSession("gho_secret_token");
    const decodedParts = sealed.split(".").map((p) => Buffer.from(p, "base64url").toString());

    expect(decodedParts.some((p) => p.includes("gho_secret_token"))).toBe(false);
  });

  it("rejects a cookie sealed with a different secret", async () => {
    const sealed = await sealSession("gho_token");
    vi.stubEnv("SESSION_SECRET", "rotated-secret");

    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=${sealed}`))).resolves.toBeNull();
  });

  it("requires SESSION_SECRET in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");

    await expect(sealSession("gho_token")).rejects.toThrow("SESSION_SECRET");
  });

  it("finds the session cookie among others", async () => {
    const signed = await sealSession("gho_token");
    const cookie = `other=1; ${SESSION_COOKIE}=${signed}; theme=dark`;

    await expect(readSession(cookieRequest(cookie))).resolves.toBe("gho_token");
  });
});

describe("cookie headers", () => {
  it("marks the session cookie httpOnly", () => {
    const header = sessionCookieHeader("signed.value");

    expect(header).toContain(`${SESSION_COOKIE}=signed.value`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
  });

  it("adds Secure only in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(sessionCookieHeader("v")).toContain("; Secure");
    expect(clearSessionCookieHeader()).toContain("; Secure");
  });

  it("omits Secure outside production", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(sessionCookieHeader("v")).not.toContain("Secure");
  });

  it("expires the session cookie on clear", () => {
    expect(clearSessionCookieHeader()).toContain("Max-Age=0");
  });
});
