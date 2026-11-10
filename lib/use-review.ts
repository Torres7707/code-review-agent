"use client";

import { useObject } from "@ai-sdk/react";
import { useMemo } from "react";
import { reviewSchema } from "@/lib/review-schema";
import { anchorReviewLines, type PartialReview } from "@/lib/review-core";
import type { FileDiff } from "@/lib/types";

export function useReview(prId: string | null, files: FileDiff[]) {
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/review",
    schema: reviewSchema,
    id: prId ?? "review",
  });

  const issues = useMemo(
    () => anchorReviewLines(object as PartialReview | undefined, files),
    [object, files],
  );

  return { object, issues, submit, isLoading, error, stop };
}
