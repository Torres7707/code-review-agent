import { describe, expect, it } from "vitest";
import { canRunReview, describeReviewError, isComplete } from "@/lib/review-status";

describe("review status", () => {
  it("allows a re-run after a stop, an error, or a finished review", () => {
    for (const s of ["ready", "done", "cached", "stopped", "error"] as const) {
      expect(canRunReview(s)).toBe(true);
    }
    expect(canRunReview("streaming")).toBe(false);
    expect(canRunReview("idle")).toBe(false);
  });

  it("treats only finished reviews as complete", () => {
    expect(isComplete("done")).toBe(true);
    expect(isComplete("cached")).toBe(true);
    expect(isComplete("stopped")).toBe(false);
    expect(isComplete("error")).toBe(false);
  });
});

describe("describeReviewError", () => {
  it("flags an expired session", () => {
    expect(describeReviewError(new Error('{"error":"unauthorized"}'))).toMatchObject({ unauthorized: true });
  });

  it("surfaces the API's error message", () => {
    expect(describeReviewError(new Error('{"error":"Not found on GitHub"}')).message).toContain(
      "Not found on GitHub",
    );
  });

  it("explains network failures", () => {
    expect(describeReviewError(new TypeError("Failed to fetch")).message).toMatch(/network/i);
  });
});
