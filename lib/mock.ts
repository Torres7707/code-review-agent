import type { Issue, PR, Repo, DiffLine, FileDiff, Severity } from "@/lib/types";

export type { Issue, PR, Repo, DiffLine, FileDiff, Severity };

export const REPOS: Repo[] = [
  { id: "nextjs", owner: "vercel", name: "next.js", language: "TypeScript", stars: 124800, updatedAt: "2h" },
  { id: "ai", owner: "vercel", name: "ai", language: "TypeScript", stars: 18200, updatedAt: "1h" },
  { id: "v0", owner: "vercel", name: "v0", language: "TypeScript", stars: 6200, updatedAt: "4h" },
  { id: "swr", owner: "vercel", name: "swr", language: "TypeScript", stars: 24500, updatedAt: "5h" },
  { id: "turbo", owner: "vercel", name: "turbo", language: "Rust", stars: 24800, updatedAt: "8h" },
];

export const PRS: Record<string, PR[]> = {
  nextjs: [
    { id: "pr-4821", number: 4821, title: "Fix race condition in app-router auth refresh", author: "torreswang", hoursAgo: 4, filesChanged: 3, additions: 1204, deletions: 890, branch: "fix/auth-race" },
    { id: "pr-4820", number: 4820, title: "Add React 19.2 compatibility layer", author: "kimockj", hoursAgo: 8, filesChanged: 7, additions: 483, deletions: 210, branch: "fix/react-19-2" },
    { id: "pr-4819", number: 4819, title: "Refactor streaming middleware internals", author: "bgentry", hoursAgo: 12, filesChanged: 11, additions: 2103, deletions: 987, branch: "feat/stream-refactor" },
    { id: "pr-4818", number: 4818, title: "Migrate createContext to app/server", author: "timneutkens", hoursAgo: 21, filesChanged: 4, additions: 340, deletions: 218, branch: "feat/async-context" },
  ],
  ai: [
    { id: "ai-pr-319", number: 319, title: "Add OpenAI Advanced reasoning support", author: "lgrammel", hoursAgo: 2, filesChanged: 5, additions: 880, deletions: 120, branch: "feat/oai-reasoning" },
    { id: "ai-pr-318", number: 318, title: "Fix stepCountIs type regression", author: "janechen", hoursAgo: 6, filesChanged: 2, additions: 140, deletions: 90, branch: "fix/step-typing" },
  ],
  v0: [
    { id: "v0-pr-142", number: 142, title: "Draft: multi-step generator pipeline", author: "nickelsey", hoursAgo: 5, filesChanged: 9, additions: 1288, deletions: 410, branch: "feat/pipeline" },
  ],
  swr: [
    { id: "swr-pr-590", number: 590, title: "Implement optimistic cache invalidation", author: "shinyaa", hoursAgo: 26, filesChanged: 6, additions: 620, deletions: 310, branch: "feat/opt-cache" },
  ],
  turbo: [
    { id: "turbo-pr-982", number: 982, title: "Add incremental compile caching for Turbopack", author: "sokra", hoursAgo: 3, filesChanged: 8, additions: 1540, deletions: 220, branch: "feat/incremental-cache" },
  ],
};

// Clean diff — spans lines 20–36 in new file
export const FILE_DIFFS: Record<string, FileDiff[]> = {
  "pr-4821": [
    {
      path: "src/app/page.tsx",
      additions: 9,
      deletions: 4,
      lines: [
        { type: "context", oldNo: 20, newNo: 20, content: "  useEffect(() => {", severity: null, issueId: null },
        { type: "context", oldNo: 21, newNo: 21, content: "    const controller = new AbortController();", severity: null, issueId: null },
        { type: "del", oldNo: 22, content: "    const token = useAuthToken();", severity: null, issueId: null },
        { type: "add", newNo: 22, content: "    const token = authTokenRef.current;", severity: null, issueId: null },
        { type: "context", oldNo: 23, newNo: 23, content: "    setLoading(true);", severity: null, issueId: null },
        { type: "del", oldNo: 24, content: "    fetch('/api/user', {", severity: null, issueId: null },
        { type: "add", newNo: 24, content: "    fetch('/api/user', {", severity: null, issueId: null },
        { type: "context", oldNo: 25, newNo: 25, content: "      headers: { Authorization: `Bearer ${token}` },", severity: "high", issueId: "iss-1" },
        { type: "context", oldNo: 26, newNo: 25, content: "      signal: controller.signal,", severity: null, issueId: null },
        { type: "context", oldNo: 27, newNo: 26, content: "    }).then(res => {", severity: null, issueId: null },
        { type: "context", oldNo: 28, newNo: 27, content: "      if (!res.ok) {", severity: null, issueId: null },
        { type: "add", newNo: 28, content: "        throw new Error(`HTTP ${res.status}`);", severity: null, issueId: null },
        { type: "del", oldNo: 29, content: "        setError('failed');", severity: null, issueId: null },
        { type: "context", oldNo: 30, newNo: 29, content: "      }", severity: null, issueId: null },
        { type: "context", oldNo: 31, newNo: 30, content: "      setUser(await res.json());", severity: null, issueId: null },
        { type: "context", oldNo: 32, newNo: 31, content: "    }).catch(err => {", severity: null, issueId: null },
        { type: "add", newNo: 32, content: "      if (err.name !== 'AbortError') {", severity: null, issueId: null },
        { type: "context", oldNo: 33, newNo: 33, content: "        setError(err.message);", severity: "medium", issueId: "iss-2" },
        { type: "context", oldNo: 33, newNo: 33, content: "      }", severity: null, issueId: null },
        { type: "del", oldNo: 34, content: "      setLoading(false);", severity: null, issueId: null },
        { type: "add", newNo: 34, content: "    }).finally(() => setLoading(false));", severity: null, issueId: null },
        { type: "context", oldNo: 35, newNo: 35, content: "  }, []);", severity: "low", issueId: "iss-3" },
        { type: "context", oldNo: 36, newNo: 36, content: "", severity: null, issueId: null },
      ],
    },
    {
      path: "src/lib/useUser.ts",
      additions: 22,
      deletions: 0,
      lines: [
        { type: "add", newNo: 1, content: "import { useRef, useState, useCallback } from 'react';", severity: null, issueId: null },
        { type: "add", newNo: 2, content: "type User = { id: string; email: string; avatar: string };", severity: null, issueId: null },
        { type: "add", newNo: 3, content: "", severity: null, issueId: null },
        { type: "add", newNo: 4, content: "export function useUser() {", severity: null, issueId: null },
        { type: "add", newNo: 5, content: "  const [user, setUser] = useState<User>();", severity: null, issueId: null },
        { type: "add", newNo: 6, content: "  const authTokenRef = useRef<string>('');", severity: null, issueId: null },
        { type: "add", newNo: 7, content: "  const refresh = useCallback(() => {", severity: "medium", issueId: "iss-4" },
        { type: "add", newNo: 8, content: "    authTokenRef.current = getToken() ?? '';", severity: null, issueId: null },
        { type: "add", newNo: 9, content: "  }, []);", severity: null, issueId: null },
        { type: "add", newNo: 10, content: "  useEffect(() => { refresh(); }, [refresh]);", severity: null, issueId: null },
        { type: "add", newNo: 11, content: "  return { user, setUser, authTokenRef };", severity: null, issueId: null },
        { type: "add", newNo: 12, content: "}", severity: null, issueId: null },
      ],
    },
  ],
};

export const ISSUES: Record<string, Issue[]> = {
  "pr-4821": [
    {
      id: "iss-1",
      severity: "high",
      title: "Stale closure captures auth token at mount time",
      file: "src/app/page.tsx",
      startLine: 25,
      why: "The effect closure captures `token` from the first render. When the token refreshes later (typical within 6 seconds), the fetched request still uses the old bearer header — silent auth failure under production load.",
      fix: "Read the token from a ref at call time rather than from the closure:\n    const token = authTokenRef.current;\n    // ...and call refresh() once on mount: useAuthTokenRefresh()",
      status: "open",
    },
    {
      id: "iss-2",
      severity: "medium",
      title: "AbortError swallowed — loading never resets on intentional cancel",
      file: "src/app/page.tsx",
      startLine: 33,
      why: "The component aborts via controller.abort() but doesn't separate AbortError from other errors. The loading state stuck at true until a successful fetch completes — poor perceived responsiveness on cancel.",
      fix: "Filter AbortError explicitly:\n    if (err.name === 'AbortError') return;\n    setError(err.message);",
      status: "open",
    },
    {
      id: "iss-3",
      severity: "low",
      title: "Effect runs on mount with empty array — fetch fires even when not needed",
      file: "src/app/page.tsx",
      startLine: 35,
      why: "[ ] deps are correct for a one-shot fetch, but the component accepts a `enabled` prop that's never consulted. When the route navigates away and returns, the user may not need to revalidate.",
      fix: "Honor enabled prop:\n    }, [enabled]);\n    if (!enabled) return null;",
      status: "resolved",
    },
    {
      id: "iss-4",
      severity: "medium",
      title: "useCallback inside useUser with empty deps — refresh closure is stale",
      file: "src/lib/useUser.ts",
      startLine: 7,
      why: "useCallback([...], []) means the returned function holds a reference to the original authTokenRef. When the parent re-renders and passes a new callback, this becomes a stale wrapper. Real refresh should bypass useCallback.",
      fix: "Return the ref directly or drop useCallback:\n    return authTokenRef.current;  // expose as method\n  }",
      status: "open",
    },
  ],
};
