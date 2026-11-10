import { describe, expect, it } from "vitest";
import { MAX_PATCH_CHARS, buildReviewPrompt, trimPatch } from "@/lib/review-core";

describe("buildReviewPrompt", () => {
  it("wraps pasted code in a fenced block", () => {
    const prompt = buildReviewPrompt({ code: "const [a] = useState(0);" });

    expect(prompt).toContain("Review this React/TypeScript code from a pull request.");
    expect(prompt).toContain("```\nconst [a] = useState(0);\n```");
  });

  it("honours a custom language label", () => {
    expect(buildReviewPrompt({ code: "let x", language: "Vue" })).toContain("Review this Vue code");
  });

  it("ignores whitespace-only pasted code", () => {
    expect(buildReviewPrompt({ code: "   \n " })).toContain("(No code or diff was provided.)");
  });

  it("prefers pasted code over a diff", () => {
    const prompt = buildReviewPrompt({
      code: "const x = 1;",
      files: [{ path: "ignored.ts", patch: "+const y = 2;" }],
    });

    expect(prompt).toContain("const x = 1;");
    expect(prompt).not.toContain("ignored.ts");
  });

  it("renders the PR header and each changed file", () => {
    const prompt = buildReviewPrompt({
      pr: { number: 4821, title: "Fix auth race", branch: "fix/auth-race" },
      files: [
        { path: "src/app/page.tsx", additions: 12, deletions: 3, patch: "+const a = 1;" },
        { path: "src/lib/useUser.ts", additions: 40, deletions: 0 },
      ],
    });

    expect(prompt).toContain("Pull request #4821: Fix auth race");
    expect(prompt).toContain("Branch: fix/auth-race");
    expect(prompt).toContain("--- src/app/page.tsx (+12 -3) ---");
    expect(prompt).toContain("+const a = 1;");
    expect(prompt).toContain("--- src/lib/useUser.ts (+40 -0) ---");
  });

  it("falls back to joined lines when a file has no patch", () => {
    const prompt = buildReviewPrompt({
      files: [{ path: "a.ts", lines: ["+one", "+two"] }],
    });

    expect(prompt).toContain("+one\n+two");
  });

  it("omits the number and branch when they are absent", () => {
    const prompt = buildReviewPrompt({ pr: { title: "Tidy up" } });

    expect(prompt).toContain("Pull request: Tidy up");
    expect(prompt).not.toContain("Branch:");
  });

  it("never sends an empty input turn", () => {
    expect(buildReviewPrompt({})).toContain("(No code or diff was provided.)");
  });
});

describe("trimPatch", () => {
  it("passes short patches through unchanged", () => {
    expect(trimPatch("+x")).toBe("+x");
  });

  it("leaves empty patches undefined", () => {
    expect(trimPatch(undefined)).toBeUndefined();
    expect(trimPatch("")).toBeUndefined();
  });

  it("truncates long patches and notes the cut", () => {
    const long = "+".repeat(MAX_PATCH_CHARS + 50);
    const trimmed = trimPatch(long)!;

    expect(trimmed).toContain("patch truncated");
    expect(trimmed.startsWith("+".repeat(MAX_PATCH_CHARS))).toBe(true);
  });
});
