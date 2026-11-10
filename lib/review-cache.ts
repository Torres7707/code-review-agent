import type { FileDiff } from "@/lib/types";
import type { PartialReview } from "@/lib/review-core";

const CACHE_PREFIX = "cra:review:v1:";
const INDEX_KEY = `${CACHE_PREFIX}__index`;
const MAX_ENTRIES = 40;

export type ReviewCacheStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/**
 * A stable fingerprint of the rendered diff. Reviews are keyed by it, so a PR
 * that gains commits reviews again while simply navigating back to one does
 * not.
 */
export function diffSignature(files: FileDiff[]): string {
  let hash = 5381;

  const mix = (text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }
  };

  for (const file of files) {
    mix(
      `${file.path}\u0000${file.additions}\u0000${file.deletions}\u0000${file.lines.length}`,
    );
    // A body edit can keep every count intact, so fold in the code itself.
    mix(file.lines[0]?.content ?? "");
    mix(file.lines[file.lines.length - 1]?.content ?? "");
  }

  return `${files.length}:${(hash >>> 0).toString(36)}`;
}

export function reviewCacheKey(prId: string, files: FileDiff[]): string {
  return `${prId}::${diffSignature(files)}`;
}

export type ReviewCache = {
  get(key: string): PartialReview | undefined;
  set(key: string, review: PartialReview): void;
  delete(key: string): void;
  clear(): void;
  size(): number;
};

/**
 * In-memory review cache, optionally mirrored to sessionStorage so a reload
 * does not spend tokens re-reviewing the same diff. Every storage call is
 * guarded: private mode and quota errors must not take the review UI down
 * with them.
 */
export function createReviewCache(
  storage?: ReviewCacheStorage | null,
): ReviewCache {
  const memory = new Map<string, PartialReview>();

  const readIndex = (): string[] => {
    if (!storage) return [];
    try {
      const raw = storage.getItem(INDEX_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((k): k is string => typeof k === "string");
    } catch {
      return [];
    }
  };

  const writeIndex = (keys: string[]) => {
    if (!storage) return;
    try {
      storage.setItem(INDEX_KEY, JSON.stringify(keys.slice(-MAX_ENTRIES)));
    } catch {
      // Storage full or unavailable: the in-memory map still works.
    }
  };

  return {
    get(key) {
      const hit = memory.get(key);
      if (hit) return hit;
      if (!storage) return undefined;
      try {
        const raw = storage.getItem(CACHE_PREFIX + key);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as PartialReview;
        memory.set(key, parsed);
        return parsed;
      } catch {
        return undefined;
      }
    },

    set(key, review) {
      memory.set(key, review);
      if (!storage) return;
      try {
        storage.setItem(CACHE_PREFIX + key, JSON.stringify(review));
        const keys = readIndex().filter((k) => k !== key);
        keys.push(key);
        while (keys.length > MAX_ENTRIES) {
          const evicted = keys.shift();
          if (evicted) {
            memory.delete(evicted);
            storage.removeItem(CACHE_PREFIX + evicted);
          }
        }
        writeIndex(keys);
      } catch {
        // Quota exceeded: keep the in-memory copy only.
      }
    },

    delete(key) {
      memory.delete(key);
      if (!storage) return;
      try {
        storage.removeItem(CACHE_PREFIX + key);
        writeIndex(readIndex().filter((k) => k !== key));
      } catch {
        // ignore
      }
    },

    clear() {
      memory.clear();
      if (!storage) return;
      try {
        for (const key of readIndex()) storage.removeItem(CACHE_PREFIX + key);
        storage.removeItem(INDEX_KEY);
      } catch {
        // ignore
      }
    },

    size() {
      return memory.size;
    },
  };
}

function sessionStorageOrNull(): ReviewCacheStorage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export const reviewCache = createReviewCache(sessionStorageOrNull());
