"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/app/components/AuthGate";
import { DiffView } from "@/app/components/DiffView";
import { Header } from "@/app/components/Header";
import { IssueCards } from "@/app/components/IssueCards";
import { PRHeader } from "@/app/components/PRHeader";
import { RepoRail } from "@/app/components/RepoRail";
import { getJson, type ApiResult, type Load } from "@/lib/api-client";
import {
  anchorReviewLines,
  annotateDiffWithIssues,
  countBySeverity,
  reviewCoverage,
} from "@/lib/review-core";
import { reviewCache, reviewCacheKey } from "@/lib/review-cache";
import { canRunReview } from "@/lib/review-status";
import { useReview } from "@/lib/use-review";
import type { FileDiff, GitHubUser, PR, PRDetail, Repo, Severity } from "@/lib/types";

type DiffPayload = { pr: PRDetail; files: FileDiff[] };

const AUTH_ERRORS: Record<string, string> = {
  state: "Sign-in was interrupted or expired. Please try again.",
  exchange: "GitHub did not complete the sign-in. Please try again.",
};

function repoKeyOf(repo: Repo): string {
  return `${repo.owner}/${repo.name}`;
}

function toLoad<T>(result: ApiResult<T>): Load<T> {
  return result.ok ? { status: "ok", data: result.data } : { status: "error", message: result.message };
}

export function CodeReviewApp() {
  const [user, setUser] = useState<GitHubUser | null | "loading">("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [repos, setRepos] = useState<Load<Repo[]>>({ status: "loading" });
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [prs, setPrs] = useState<{ repoKey: string; load: Load<PR[]> } | null>(null);
  const [activePrNumber, setActivePrNumber] = useState<number | null>(null);
  const [diff, setDiff] = useState<{ prKey: string; load: Load<DiffPayload> } | null>(null);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  // What the user most recently picked. Responses for anything else are
  // stale and dropped. Only read and written in event handlers and callbacks.
  const currentRepoKey = useRef<string | null>(null);
  const currentPrKey = useRef<string | null>(null);

  const activeRepo = useMemo(
    () => (repos.status === "ok" ? (repos.data.find((r) => r.id === activeRepoId) ?? null) : null),
    [repos, activeRepoId],
  );
  const repoKey = activeRepo ? repoKeyOf(activeRepo) : null;
  const prList = prs && prs.repoKey === repoKey ? prs.load : null;
  const activePr =
    prList?.status === "ok" ? (prList.data.find((p) => p.number === activePrNumber) ?? null) : null;
  const prKey = repoKey && activePr ? `${repoKey}#${activePr.number}` : null;
  const diffLoad: Load<DiffPayload> | null = diff && diff.prKey === prKey ? diff.load : null;
  const loaded = diffLoad?.status === "ok" ? diffLoad.data : null;
  const files = useMemo(() => loaded?.files ?? [], [loaded]);
  const reviewKey = prKey && loaded ? reviewCacheKey(prKey, loaded.pr.headSha) : null;

  const resetSession = useCallback(() => {
    currentRepoKey.current = null;
    currentPrKey.current = null;
    setUser(null);
    setRepos({ status: "loading" });
    setActiveRepoId(null);
    setPrs(null);
    setActivePrNumber(null);
    setDiff(null);
    setActiveIssueId(null);
  }, []);

  const review = useReview(reviewKey, { onUnauthorized: resetSession });
  const { start: startReview, cancel: cancelReview } = review;

  /** Turns a 401 from any of our endpoints into "signed out". */
  const handleResult = useCallback(
    <T,>(result: ApiResult<T>): Load<T> => {
      if (!result.ok && result.status === 401) resetSession();
      return toLoad(result);
    },
    [resetSession],
  );

  const issues = useMemo(
    () => anchorReviewLines(review.review, files, reviewKey ?? "review"),
    [review.review, files, reviewKey],
  );
  const annotatedFiles = useMemo(() => annotateDiffWithIssues(files, issues), [files, issues]);
  const counts = useMemo(() => countBySeverity(issues), [issues]);
  const coverage = useMemo(() => reviewCoverage(files), [files]);
  const visibleIssues = useMemo(
    () => (severityFilter ? issues.filter((i) => i.severity === severityFilter) : issues),
    [issues, severityFilter],
  );

  const loadRepos = useCallback(() => {
    setRepos({ status: "loading" });
    void getJson<{ repos: Repo[] }>("/api/repos").then((result) => {
      const load = handleResult(result);
      setRepos(load.status === "ok" ? { status: "ok", data: load.data.repos } : load);
    });
  }, [handleResult]);

  useEffect(() => {
    let cancelled = false;
    void getJson<{ user: GitHubUser | null }>("/api/me").then((result) => {
      if (cancelled) return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get("auth_error");
      if (code) {
        setAuthError(AUTH_ERRORS[code] ?? AUTH_ERRORS.exchange!);
        window.history.replaceState(null, "", window.location.pathname);
      }
      const signedIn = result.ok ? result.data.user : null;
      setUser(signedIn);
      if (signedIn) loadRepos();
    });
    return () => {
      cancelled = true;
    };
  }, [loadRepos]);

  const loadPrs = useCallback(
    (repo: Repo) => {
      const key = repoKeyOf(repo);
      setPrs({ repoKey: key, load: { status: "loading" } });
      void getJson<{ prs: PR[] }>(
        `/api/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/prs`,
      ).then((result) => {
        if (currentRepoKey.current !== key) return;
        const load = handleResult(result);
        setPrs({ repoKey: key, load: load.status === "ok" ? { status: "ok", data: load.data.prs } : load });
      });
    },
    [handleResult],
  );

  const loadDiff = useCallback(
    (repo: Repo, pr: PR) => {
      const key = `${repoKeyOf(repo)}#${pr.number}`;
      setDiff({ prKey: key, load: { status: "loading" } });
      void getJson<DiffPayload>(
        `/api/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/prs/${pr.number}/diff`,
      ).then((result) => {
        if (currentPrKey.current !== key) return;
        const load = handleResult(result);
        setDiff({ prKey: key, load });
        // Review automatically once the diff is in (served from cache when
        // this head commit was already reviewed).
        if (load.status === "ok") {
          startReview(reviewCacheKey(key, load.data.pr.headSha), {
            owner: repo.owner,
            repo: repo.name,
            number: pr.number,
          });
        }
      });
    },
    [handleResult, startReview],
  );

  const onPickRepo = useCallback(
    (repo: Repo) => {
      cancelReview();
      currentRepoKey.current = repoKeyOf(repo);
      currentPrKey.current = null;
      setActiveRepoId(repo.id);
      setActivePrNumber(null);
      setDiff(null);
      setActiveIssueId(null);
      setSeverityFilter(null);
      loadPrs(repo);
    },
    [cancelReview, loadPrs],
  );

  const onPickPR = useCallback(
    (pr: PR) => {
      if (!activeRepo) return;
      const key = `${repoKeyOf(activeRepo)}#${pr.number}`;
      setRailOpen(false);
      if (currentPrKey.current === key && diffLoad?.status !== "error") return;
      cancelReview();
      currentPrKey.current = key;
      setActivePrNumber(pr.number);
      setActiveIssueId(null);
      setSeverityFilter(null);
      loadDiff(activeRepo, pr);
    },
    [activeRepo, cancelReview, diffLoad, loadDiff],
  );

  const runReview = useCallback(() => {
    if (!activeRepo || !activePr || !reviewKey) return;
    setActiveIssueId(null);
    startReview(
      reviewKey,
      { owner: activeRepo.owner, repo: activeRepo.name, number: activePr.number },
      true,
    );
  }, [activeRepo, activePr, reviewKey, startReview]);

  const retryDiff = useCallback(() => {
    if (activeRepo && activePr) loadDiff(activeRepo, activePr);
  }, [activeRepo, activePr, loadDiff]);

  const retryPrs = useCallback(() => {
    if (activeRepo) loadPrs(activeRepo);
  }, [activeRepo, loadPrs]);

  // Clicking a card scrolls its line into view in the diff column. This runs
  // in the event handler, not an effect, so streaming updates never yank the
  // scroll position while the user is reading.
  const onPickIssue = useCallback(
    (id: string) => {
      const next = activeIssueId === id ? null : id;
      setActiveIssueId(next);
      if (!next) return;
      const line = document.querySelector(`[data-issue-id="${CSS.escape(next)}"]`);
      if (line) {
        line.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      // No rendered line maps to this issue: show the file header instead.
      const issue = issues.find((i) => i.id === next);
      if (!issue) return;
      document
        .querySelector(`[data-file-path="${CSS.escape(issue.file)}"]`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [activeIssueId, issues],
  );

  const onLineClick = useCallback(
    (id: string) => {
      setActiveIssueId(id);
      const issue = issues.find((i) => i.id === id);
      if (issue && severityFilter && issue.severity !== severityFilter) setSeverityFilter(null);
      // Wait a frame so a card hidden by the filter is rendered before scrolling.
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-card-id="${CSS.escape(id)}"]`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },
    [issues, severityFilter],
  );

  const signOut = useCallback(() => {
    cancelReview();
    // Cached reviews describe private code; do not leave them in sessionStorage.
    reviewCache.clear();
    void fetch("/api/auth/signout", { method: "POST" }).finally(resetSession);
  }, [cancelReview, resetSession]);

  if (user === "loading") {
    return (
      <>
        <Header user={null} />
        <div
          role="status"
          className="flex h-[calc(100vh-3rem)] items-center justify-center bg-[var(--bg-base)] text-[13px] text-[var(--text-muted)]"
        >
          Loading…
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header user={null} />
        <AuthGate error={authError} />
      </>
    );
  }

  const diffMessage = !activeRepo
    ? "Pick a repository from the left rail."
    : !activePr
      ? "Pick a pull request to see its diff."
      : loaded && files.length === 0
        ? "This pull request has no file changes."
        : "";

  return (
    <div className="code-review-workspace flex h-screen flex-col bg-[var(--bg-base)]">
      <Header
        user={{ login: user.login, avatar: user.avatar_url }}
        onSignOut={signOut}
        railOpen={railOpen}
        onToggleRail={() => setRailOpen((v) => !v)}
      />
      <div className="code-review-body relative flex min-h-0 flex-1">
        <RepoRail
          open={railOpen}
          repos={repos}
          activeRepoId={activeRepoId}
          prs={prList}
          activePrNumber={activePrNumber}
          onPickRepo={onPickRepo}
          onPickPR={onPickPR}
          onRetryRepos={loadRepos}
          onRetryPrs={retryPrs}
        />
        <main className="code-review-main flex min-w-0 flex-1">
          <section
            aria-label="Pull request diff"
            className="code-review-diff flex h-full min-w-0 flex-1 flex-col"
          >
            <PRHeader
              pr={activePr}
              detail={loaded?.pr ?? null}
              status={review.status}
              canRun={canRunReview(review.status)}
              onRun={runReview}
              onStop={review.stop}
            />
            <DiffView
              files={annotatedFiles}
              activeIssueId={activeIssueId}
              onLineClick={onLineClick}
              loading={diffLoad?.status === "loading"}
              error={diffLoad?.status === "error" ? diffLoad.message : null}
              onRetry={retryDiff}
              emptyMessage={diffMessage}
            />
          </section>
          <IssueCards
            issues={visibleIssues}
            counts={counts}
            totalIssues={issues.length}
            status={review.status}
            errorMessage={review.error}
            summary={review.review?.summary}
            coverage={loaded ? coverage : null}
            activeId={activeIssueId}
            severityFilter={severityFilter}
            onFilter={setSeverityFilter}
            onPick={onPickIssue}
            onRetry={canRunReview(review.status) ? runReview : undefined}
          />
        </main>
      </div>
    </div>
  );
}
