"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/app/components/AuthGate";
import { DiffView } from "@/app/components/DiffView";
import { Header } from "@/app/components/Header";
import { IssueCards } from "@/app/components/IssueCards";
import { RepoRail } from "@/app/components/RepoRail";
import { useReview } from "@/lib/use-review";
import type { FileDiff, GitHubUser, PR, Repo } from "@/lib/types";

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function CodeReviewApp() {
  const [user, setUser] = useState<GitHubUser | null | "loading">("loading");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [activePrId, setActivePrId] = useState<string | null>(null);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [fileDiffsByKey, setFileDiffsByKey] = useState<{
    key: string | null;
    files: FileDiff[];
  }>({ key: null, files: [] });
  const [reviewedPrId, setReviewedPrId] = useState<string | null>(null);

  const activeRepo = useMemo(
    () => repos.find((r) => r.id === activeRepoId) ?? null,
    [repos, activeRepoId],
  );
  const activePr = useMemo(
    () => prs.find((p) => p.id === activePrId) ?? null,
    [prs, activePrId],
  );

  const prKey =
    activeRepo && activePr
      ? `${activeRepo.owner}/${activeRepo.name}#${activePr.number}`
      : null;
  const fileDiffs = prKey !== null && fileDiffsByKey.key === prKey ? fileDiffsByKey.files : [];
  const diffsLoading = prKey !== null && fileDiffsByKey.key !== prKey;

  const {
    issues,
    submit,
    isLoading: reviewLoading,
    error: reviewError,
    stop,
  } = useReview(reviewedPrId, fileDiffs);

  // Latest submit without making it an effect dependency (see the review effect).
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: { user: GitHubUser | null }) => {
        if (!cancelled) setUser(d.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || user === "loading") return;
    let cancelled = false;
    getJson<{ repos: Repo[] }>("/api/repos").then((d) => {
      if (!cancelled) setRepos(d?.repos ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!activeRepo) return;
    let cancelled = false;
    getJson<{ prs: PR[] }>(
      `/api/repos/${activeRepo.owner}/${activeRepo.name}/prs`,
    ).then((d) => {
      if (!cancelled) setPrs(d?.prs ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [activeRepo]);

  useEffect(() => {
    if (!activeRepo || !activePr || prKey === null) return;
    let cancelled = false;
    getJson<{ diffs: FileDiff[] }>(
      `/api/repos/${activeRepo.owner}/${activeRepo.name}/prs/${activePr.number}/diff`,
    )
      .then((d) => {
        if (!cancelled) {
          setFileDiffsByKey({ key: prKey, files: d?.diffs ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) setFileDiffsByKey({ key: prKey, files: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [activeRepo, activePr, prKey]);

  // Kick off exactly one review per PR; the PR key is the only trigger so a
  // changing `submit` identity cannot re-run the request.
  useEffect(() => {
    if (!activeRepo || !activePr || prKey === null || diffsLoading) return;
    submitRef.current({
      owner: activeRepo.owner,
      repo: activeRepo.name,
      pr: {
        number: activePr.number,
        title: activePr.title,
        branch: activePr.branch,
      },
    });
  }, [activeRepo, activePr, prKey, diffsLoading]);

  const onPickRepo = useCallback((id: string) => {
    setActiveRepoId(id);
    setActivePrId(null);
    setActiveIssueId(null);
  }, []);

  const onPickPR = useCallback((target: PR) => {
    setActivePrId(target.id);
    setReviewedPrId(target.id);
    setActiveIssueId(null);
  }, []);

  const signOut = useCallback(() => {
    fetch("/api/auth/signout", { method: "POST" }).then(() => {
      setUser(null);
      setRepos([]);
      setPrs([]);
      setActiveRepoId(null);
      setActivePrId(null);
      setActiveIssueId(null);
    });
  }, []);

  if (user === "loading") {
    return (
      <>
        <Header user={null} />
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center bg-[var(--bg-base)] text-[13px] text-[var(--text-muted)]">
          Loading…
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header user={null} />
        <AuthGate
          onSignIn={() => {
            window.location.href = "/api/auth/github";
          }}
        />
      </>
    );
  }

  const isStreaming = reviewLoading;
  const hasIssues = issues.length > 0;

  return (
    <div className="code-review-workspace flex h-screen flex-col bg-[var(--bg-base)]">
      <Header
        user={{ login: user.login, avatar: user.avatar_url }}
        onSignOut={signOut}
      />
      <div className="flex min-h-0 flex-1">
        <RepoRail
          repos={repos}
          activeRepoId={activeRepoId}
          prs={prs}
          activePrId={activePrId}
          onPickRepo={onPickRepo}
          onPickPR={onPickPR}
        />
        <main className="code-review-main flex min-w-0 flex-1">
          <section className="flex h-full min-w-0 flex-1 flex-col border-r border-[var(--border-default)]">
            <PRHeader
              pr={activePr}
              isStreaming={isStreaming}
              hasIssues={hasIssues}
              onStop={stop}
            />
            <DiffView
              files={fileDiffs}
              activeIssueId={activeIssueId}
              onLineClick={(id) => setActiveIssueId(id)}
              loading={diffsLoading}
              emptyMessage={
                activeRepo && !activePr
                  ? "Pick a pull request from the left rail to see its diff."
                  : "Pick a PR from the left rail to see its diff."
              }
            />
          </section>
          <IssueCards
            issues={issues}
            streamedIds={issues.map((i) => i.id)}
            activeId={activeIssueId}
            isStreaming={isStreaming}
            errorMessage={reviewError?.message}
            onPick={(id) => setActiveIssueId((prev) => (prev === id ? null : id))}
          />
        </main>
      </div>
    </div>
  );
}

function PRHeader({
  pr,
  isStreaming,
  hasIssues,
  onStop,
}: {
  pr: PR | null;
  isStreaming: boolean;
  hasIssues: boolean;
  onStop: () => void;
}) {
  if (!pr) {
    return (
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-4 py-2.5 text-[12px] text-[var(--text-muted)]">
        No pull request selected
      </div>
    );
  }

  const status = isStreaming
    ? { label: "Reviewing", tone: "bg-[var(--accent)]/15 text-[var(--accent)]" }
    : hasIssues
      ? { label: "Finished", tone: "bg-[var(--sev-low)]/15 text-[var(--sev-low)]" }
      : { label: "No issues", tone: "bg-[var(--bg-raised)] text-[var(--text-muted)]" };

  return (
    <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <span className="font-mono text-[var(--accent)]">#{pr.number}</span>
            <span className="truncate">{pr.title}</span>
            <span className="hidden text-[11px] text-[var(--text-muted)] sm:inline">
              · {pr.branch}
            </span>
          </div>
          {pr.additions !== undefined ? (
            <div className="mt-0.5 tabnum text-[11px] text-[var(--text-muted)]">
              <span className="text-[#7ee787]">+{pr.additions}</span>{" "}
              <span className="text-[#ffa198]">-{pr.deletions}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-md border border-[var(--border-default)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
            >
              Stop
            </button>
          ) : null}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${status.tone}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
