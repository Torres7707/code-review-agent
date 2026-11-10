/**
 * - idle:      no PR selected, or its diff is still loading
 * - ready:     the diff is loaded and no review has run yet
 * - streaming: the model is answering
 * - done:      a complete review arrived in this session
 * - cached:    a complete review for this exact head commit was cached earlier
 * - stopped:   the user stopped the review; what is shown is partial
 * - error:     the review failed; what is shown (if anything) is partial
 */
export type ReviewStatus = "idle" | "ready" | "streaming" | "done" | "cached" | "stopped" | "error";

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  idle: "Idle",
  ready: "Not reviewed",
  streaming: "Reviewing",
  done: "Finished",
  cached: "Cached",
  stopped: "Stopped · partial",
  error: "Failed",
};

/** Statuses after which the user can start (another) review. */
export function canRunReview(status: ReviewStatus): boolean {
  return status === "ready" || status === "done" || status === "cached" || status === "stopped" || status === "error";
}

/** Statuses whose result is complete, so "no issues" really means none were found. */
export function isComplete(status: ReviewStatus): boolean {
  return status === "done" || status === "cached";
}

export type ReviewErrorInfo = { message: string; unauthorized: boolean };

/**
 * `useObject` turns a non-2xx response into an Error whose message is the
 * raw response body. Map it to something a person can act on.
 */
export function describeReviewError(error: unknown): ReviewErrorInfo {
  const raw = error instanceof Error ? error.message : String(error);
  let apiError: string | undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
      apiError = parsed.error;
    }
  } catch {
    // Not a JSON body.
  }

  if (apiError === "unauthorized") {
    return { message: "Your GitHub session expired. Sign in again.", unauthorized: true };
  }
  if (apiError) return { message: `Review failed: ${apiError}.`, unauthorized: false };
  if (/fetch|network/i.test(raw)) {
    return { message: "Network error while reviewing. Check your connection and try again.", unauthorized: false };
  }
  return { message: "The review failed before it finished. Try again.", unauthorized: false };
}

export const INCOMPLETE_REVIEW_MESSAGE =
  "The model stopped before returning a complete review. What is shown may be partial. Try again.";
