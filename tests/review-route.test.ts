import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import { readSession } from "@/lib/github-auth";
import { getPull, listPullFiles } from "@/lib/github";

vi.mock("@/lib/github-auth", () => ({ readSession: vi.fn() }));
vi.mock("@/lib/github", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/github")>()),
  getPull: vi.fn(),
  listPullFiles: vi.fn(),
}));

const PULL = {
  number: 7,
  title: "Add counter",
  state: "open",
  html_url: "https://github.com/o/r/pull/7",
  updated_at: "2026-11-01T00:00:00Z",
  additions: 1,
  deletions: 0,
  changed_files: 1,
  user: { login: "me" },
  head: { ref: "feat/counter", sha: "abc123" },
};
const FILES = [
  { filename: "src/app/page.tsx", additions: 1, deletions: 0, patch: "@@ -11,0 +12,1 @@\n+setCount(count + 1);" },
];

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
      endLine: null,
      quote: "setCount(count + 1);",
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

const VALID = { owner: "o", repo: "r", number: 7 };

describe("POST /api/review", () => {
  beforeEach(() => {
    vi.mocked(readSession).mockResolvedValue("gho_token");
    vi.mocked(getPull).mockResolvedValue({ ok: true, data: PULL });
    vi.mocked(listPullFiles).mockResolvedValue({ ok: true, data: FILES });
  });

  it("requires a session for every request", async () => {
    vi.mocked(readSession).mockResolvedValue(null);
    const res = await postReview({ code: "anything" });
    expect(res.status).toBe(401);
    expect(getPull).not.toHaveBeenCalled();
  });

  it("rejects an unparseable body", async () => {
    const res = await postReview("{not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });

  it("rejects free-form code instead of sending it to the model", async () => {
    const res = await postReview({ code: "const x = 1;" });
    expect(res.status).toBe(400);
  });

  it("rejects owner or repo values that could escape the API path", async () => {
    for (const body of [
      { owner: "a/../../user", repo: "r", number: 1 },
      { owner: "o", repo: "..", number: 1 },
      { owner: "o", repo: "r?x=1", number: 1 },
    ]) {
      expect((await postReview(body)).status).toBe(400);
    }
    expect(getPull).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies", async () => {
    const res = await postReview({ ...VALID, padding: "x".repeat(5000) });
    expect(res.status).toBe(413);
  });

  it("reports a missing gateway key instead of calling a model", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    const res = await postReview(VALID);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("AI_GATEWAY_API_KEY") });
  });

  it("passes a GitHub 401 through so the client can sign out", async () => {
    vi.mocked(getPull).mockResolvedValue({ ok: false, status: 401 });
    const res = await postReview(VALID);
    expect(res.status).toBe(401);
  });

  it("streams the model's structured review of the PR fetched server-side", async () => {
    const model = modelStreaming(JSON.stringify(REVIEW));
    (globalThis as { AI_SDK_DEFAULT_PROVIDER?: unknown }).AI_SDK_DEFAULT_PROVIDER = {
      languageModel: () => model,
    };

    const res = await postReview(VALID);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(JSON.parse(await readAll(res))).toEqual(REVIEW);
    expect(getPull).toHaveBeenCalledWith("gho_token", "o", "r", 7);
    expect(JSON.stringify(model.doStreamCalls[0]?.prompt)).toContain("12 + setCount(count + 1);");
  });
});
