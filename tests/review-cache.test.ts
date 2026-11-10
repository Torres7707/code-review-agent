import { describe, expect, it } from "vitest";
import {
  createReviewCache,
  reviewCacheKey,
  type ReviewCacheStorage,
} from "@/lib/review-cache";

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

describe("reviewCacheKey", () => {
  it("separates PRs and head commits", () => {
    expect(reviewCacheKey("a/b#1", "sha1")).toBe(reviewCacheKey("a/b#1", "sha1"));
    expect(reviewCacheKey("a/b#1", "sha1")).not.toBe(reviewCacheKey("a/b#2", "sha1"));
    expect(reviewCacheKey("a/b#1", "sha1")).not.toBe(reviewCacheKey("a/c#1", "sha1"));
  });

  it("misses the cache after a new push to the same PR", () => {
    const cache = createReviewCache(undefined);
    cache.set(reviewCacheKey("a/b#1", "old"), REVIEW);

    expect(cache.get(reviewCacheKey("a/b#1", "new"))).toBeUndefined();
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
