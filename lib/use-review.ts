"use client";

import { useObject } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reviewSchema } from "@/lib/review-schema";
import type { PartialReview } from "@/lib/review-core";
import { reviewCache } from "@/lib/review-cache";
import {
  INCOMPLETE_REVIEW_MESSAGE,
  describeReviewError,
  type ReviewStatus,
} from "@/lib/review-status";

export type ReviewRequest = { owner: string; repo: string; number: number };

type Run = {
  key: string;
  state: "streaming" | "done" | "stopped" | "error";
  error?: string;
};

/**
 * Streams a review and tracks its state explicitly, per cache key
 * (`owner/repo#number@headSha`). Only one review runs at a time; the object
 * from `useObject` is shown only while it belongs to the active key.
 */
export function useReview(activeKey: string | null, options: { onUnauthorized: () => void }) {
  const [run, setRun] = useState<Run | null>(null);
  // The key of the request in flight. Read and written only in callbacks.
  const pendingKey = useRef<string | null>(null);
  const onUnauthorized = useRef(options.onUnauthorized);

  const { object, submit, stop } = useObject({
    api: "/api/review",
    schema: reviewSchema,
    id: "cra-review",
    onFinish: ({ object: finished, error }) => {
      const key = pendingKey.current;
      pendingKey.current = null;
      if (!key) return;
      if (error || !finished) {
        setRun({ key, state: "error", error: INCOMPLETE_REVIEW_MESSAGE });
        return;
      }
      // Only a complete, schema-valid review may be cached: a cache hit skips
      // the request, so caching a partial result would freeze the gap.
      reviewCache.set(key, finished);
      setRun({ key, state: "done" });
    },
    onError: (error) => {
      const key = pendingKey.current;
      pendingKey.current = null;
      if (!key) return;
      const info = describeReviewError(error);
      setRun({ key, state: "error", error: info.message });
      if (info.unauthorized) onUnauthorized.current();
    },
  });

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
    onUnauthorized.current = options.onUnauthorized;
  });

  /** Starts a review. Uses the cache unless `force` is set. */
  const start = useCallback((key: string, request: ReviewRequest, force = false) => {
    if (!force && reviewCache.get(key)) {
      setRun(null);
      return;
    }
    if (force) reviewCache.delete(key);
    pendingKey.current = key;
    setRun({ key, state: "streaming" });
    void submitRef.current(request);
  }, []);

  const stopReview = useCallback(() => {
    const key = pendingKey.current;
    pendingKey.current = null;
    stop();
    if (key) setRun({ key, state: "stopped" });
  }, [stop]);

  /** Aborts any running review without marking it, e.g. when switching PRs. */
  const cancel = useCallback(() => {
    pendingKey.current = null;
    stop();
    setRun(null);
  }, [stop]);

  const current = run && run.key === activeKey ? run : null;
  const runState = current?.state;
  const cached = useMemo(
    // Re-read after a run finishes, since that is when the cache is written.
    () => (activeKey && runState !== "streaming" ? reviewCache.get(activeKey) : undefined),
    [activeKey, runState],
  );

  let review: PartialReview | undefined;
  let status: ReviewStatus;
  if (current) {
    status = current.state;
    review = current.state === "done" ? (cached ?? (object as PartialReview)) : (object as PartialReview | undefined);
  } else if (cached) {
    status = "cached";
    review = cached;
  } else {
    status = activeKey ? "ready" : "idle";
  }

  return {
    review,
    status,
    error: current?.error,
    start,
    stop: stopReview,
    cancel,
  };
}
