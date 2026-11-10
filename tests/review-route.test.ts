import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import { readSession } from "@/lib/github-auth";

vi.mock("@/lib/github-auth", () => ({ readSession: vi.fn() }));

function modelStreaming(json: string) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: json },
          { type: "text-end", id: "t1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "stop" },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 20, text: 20, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  });
}

async function postReview(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/review/route");
  return POST(
    new Request("http://localhost/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function readAll(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

const REVIEW = {
  summary: "One stale closure.",
  issues: [
    {
      severity: "high",
      title: "Stale closure over count",
      file: "src/app/page.tsx",
      startLine: 12,
      why: "The effect captures count once.",
      fix: "Add count to the dependency array.",
    },
  ],
};

beforeEach(() => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  vi.stubEnv("AI_MODEL", "test/model");
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as { AI_SDK_DEFAULT_PROVIDER?: unknown }).AI_SDK_DEFAULT_PROVIDER;
  vi.clearAllMocks();
});

describe("POST /api/review", () => {
  it("rejects an unparseable body", async () => {
    const res = await postReview("{not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });

  it("reports a missing gateway key instead of calling a model", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    const res = await postReview({ code: "const x = 1;" });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("AI_GATEWAY_API_KEY") });
  });

  it("requires a session when asked to fetch a PR from GitHub", async () => {
    vi.mocked(readSession).mockResolvedValue(null);
    const res = await postReview({ owner: "vercel", repo: "next.js", pr: { number: 1 } });
    expect(res.status).toBe(401);
  });

  it("streams the model's structured review", async () => {
    vi.mocked(readSession).mockResolvedValue(null);
    (globalThis as { AI_SDK_DEFAULT_PROVIDER?: unknown }).AI_SDK_DEFAULT_PROVIDER = {
      languageModel: () => modelStreaming(JSON.stringify(REVIEW)),
    };

    const res = await postReview({ code: "useEffect(() => {}, [])" });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(JSON.parse(await readAll(res))).toEqual(REVIEW);
  });
});
