import { describe, expect, it } from "vitest";
import {
  createReviewCache,
  diffSignature,
  reviewCacheKey,
  type ReviewCacheStorage,
} from "@/lib/review-cache";
import type { FileDiff } from "@/lib/types";

function file(path: string, contents: string[]): FileDiff {
  return {
    path,
    additions: contents.length,
    deletions: 0,
    lines: contents.map((content, idx) => ({
      type: "add" as const,
      newNo: idx + 1,
      content,
      severity: null,
      issueId: null,
    })),
  };
}

function memoryStorage(): ReviewCacheStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

const REVIEW = { summary: "s", issues: [{ title: "t" }] };

describe("diffSignature", () => {
  it("is stable for the same diff", () => {
    const a = [file("a.ts", ["1", "2"])];
    const b = [file("a.ts", ["1", "2"])];

    expect(diffSignature(a)).toBe(diffSignature(b));
  });

  it("changes when a file path changes", () => {
    expect(diffSignature([file("a.ts", ["1"])])).not.toBe(
      diffSignature([file("b.ts", ["1"])]),
    );
  });

  it("changes when the first or last line changes", () => {
    const base = diffSignature([file("a.ts", ["1", "2", "3"])]);

    expect(diffSignature([file("a.ts", ["9", "2", "3"])])).not.toBe(base);
    expect(diffSignature([file("a.ts", ["1", "2", "9"])])).not.toBe(base);
  });

  it("changes when the line count changes", () => {
    expect(diffSignature([file("a.ts", ["1"])])).not.toBe(
      diffSignature([file("a.ts", ["1", "2"])]),
    );
  });

  it("distinguishes files whose parts collide when concatenated", () => {
    expect(diffSignature([file("a", ["1"]), file("bc", ["2"])])).not.toBe(
      diffSignature([file("ab", ["1"]), file("c", ["2"])]),
    );
  });

  it("handles an empty diff", () => {
    expect(diffSignature([])).toBe("0:45h");
  });
});

describe("reviewCacheKey", () => {
  it("namespaces the signature by PR", () => {
    const files = [file("a.ts", ["1"])];

    expect(reviewCacheKey("pr-1", files)).not.toBe(reviewCacheKey("pr-2", files));
    expect(reviewCacheKey("pr-1", files)).toBe(reviewCacheKey("pr-1", files));
  });
});

describe("createReviewCache", () => {
  it("round-trips an object through memory", () => {
    const cache = createReviewCache(memoryStorage());

    cache.set("k", REVIEW);
    expect(cache.get("k")).toEqual(REVIEW);
  });

  it("survives a fresh instance with the same storage", () => {
    const storage = memoryStorage();
    createReviewCache(storage).set("k", REVIEW);

    expect(createReviewCache(storage).get("k")).toEqual(REVIEW);
  });

  it("works with no storage at all", () => {
    const cache = createReviewCache(undefined);

    cache.set("k", REVIEW);
    expect(cache.get("k")).toEqual(REVIEW);
  });

  it("returns undefined for a missing key", () => {
    expect(createReviewCache(memoryStorage()).get("nope")).toBeUndefined();
  });

  it("does not take the UI down when the storage throws", () => {
    const broken: ReviewCacheStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const cache = createReviewCache(broken);

    expect(() => cache.set("k", REVIEW)).not.toThrow();
    expect(cache.get("k")).toEqual(REVIEW);
  });

  it("deletes and clears entries", () => {
    const cache = createReviewCache(memoryStorage());

    cache.set("a", REVIEW);
    cache.set("b", REVIEW);
    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size()).toBe(1);

    cache.clear();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });
});
