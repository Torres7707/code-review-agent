"use client";

import { useObject } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { reviewSchema } from "@/lib/review-schema";
import { anchorReviewLines, type PartialReview } from "@/lib/review-core";
import { reviewCache, reviewCacheKey } from "@/lib/review-cache";
import type { FileDiff } from "@/lib/types";

type SubmitBody = Parameters<ReturnType<typeof useObject>["submit"]>[0];

export function useReview(
  prId: string | null,
  files: FileDiff[],
  cacheNamespace?: string | null,
) {
  // `prId` is only `pr-<number>`, which several repos can share. The object id
  // is the SWR cache key, so two repos' #1 would otherwise share state.
  const objectId =
    prId && cacheNamespace ? `${cacheNamespace}|${prId}` : (prId ?? "review");

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/review",
    schema: reviewSchema,
    id: objectId,
  });

  // A review that was stopped or errored is partial; caching it would freeze
  // the gap for every later visit.
  const incomplete = useRef(false);

  const cacheKey = useMemo(
    () => (prId && files.length > 0 ? reviewCacheKey(objectId, files) : null),
    [prId, objectId, files],
  );

  const cached = useMemo(
    () => (cacheKey ? reviewCache.get(cacheKey) : undefined),
    [cacheKey],
  );

  const review = cached ?? (object as PartialReview | undefined);

  // Only a finished review may enter the cache. Writing while the stream is
  // still running stores a truncated object, and since a cache hit skips the
  // request, that truncation would become permanent.
  const finished = !isLoading && !error && !incomplete.current;

  useEffect(() => {
    if (!cacheKey || !finished || !review) return;
    reviewCache.set(cacheKey, review);
  }, [cacheKey, finished, review]);

  const submitCached = useCallback(
    (body: SubmitBody) => {
      if (cacheKey && reviewCache.get(cacheKey)) return;
      incomplete.current = false;
      submit(body);
    },
    [cacheKey, submit],
  );

  const stopAndMark = useCallback(() => {
    incomplete.current = true;
    stop();
  }, [stop]);

  const issues = useMemo(() => anchorReviewLines(review, files), [review, files]);

  return {
    object: review,
    issues,
    submit: submitCached,
    stop: stopAndMark,
    isLoading: isLoading && !cached,
    error,
    fromCache: Boolean(cached),
  };
}
