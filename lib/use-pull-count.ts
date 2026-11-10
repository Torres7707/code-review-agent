"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type PullSummary = {
  number: number;
  title: string;
};

/**
 * Loads the open pull requests for a repo so the rail can show a count.
 *
 * Keeps the last result around while a new repo loads, which avoids the list
 * flashing empty when you click down a long rail.
 */
export function usePullCount(
  owner: string | null,
  repo: string | null,
): { count: number; loading: boolean; error: string | null; isEmpty: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!owner || !repo) {
      setCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs`,
      );
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      const data = (await res.json()) as { prs: PullSummary[] };
      setCount(data.prs.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pull requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [owner, repo, load]);

  // Recomputed on every render, keyed off the count itself.
  const isEmpty = useMemo(() => count === 0, [count, loading, error]);

  return { count, loading, error, isEmpty };
}
