import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE,
  clearSessionCookieHeader,
  readSession,
  sessionCookieHeader,
  signSession,
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

describe("signSession / readSession", () => {
  it("round-trips a GitHub access token", async () => {
    const token = "gho_1234567890abcdef";
    const signed = await signSession(token);

    expect(signed).not.toContain(token);
    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=${signed}`))).resolves.toBe(token);
  });

  it("rejects a missing cookie", async () => {
    await expect(readSession(cookieRequest(""))).resolves.toBeNull();
  });

  it("rejects a cookie that was never signed", async () => {
    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=gho_plain`))).resolves.toBeNull();
  });

  it("rejects a tampered token", async () => {
    const signed = await signSession("gho_original");
    const mac = signed.slice(signed.lastIndexOf(".") + 1);
    const forged = `${Buffer.from("gho_attacker").toString("base64url")}.${mac}`;

    await expect(readSession(cookieRequest(`${SESSION_COOKIE}=${forged}`))).resolves.toBeNull();
  });

  it("finds the session cookie among others", async () => {
    const signed = await signSession("gho_token");
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
