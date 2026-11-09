"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/app/components/AuthGate";
import { DiffView } from "@/app/components/DiffView";
import { Header } from "@/app/components/Header";
import { IssueCards } from "@/app/components/IssueCards";
import { RepoRail } from "@/app/components/RepoRail";
import { FILE_DIFFS, ISSUES, REPOS } from "@/lib/mock";
import type { FileDiff, GitHubUser, Issue, PR, Repo } from "@/lib/types";

export function CodeReviewApp() {
  const [user, setUser] = useState<GitHubUser | null | "loading">("loading");
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [prs, setPrs] = useState<PR[]>([]);
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [activePrId, setActivePrId] = useState<string | null>(null);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [fileDiffs, setFileDiffs] = useState<FileDiff[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [streamedIds, setStreamedIds] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Detect existing session on mount.
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

  const activeRepo = useMemo(
    () => (repos ?? []).find((r) => r.id === activeRepoId) ?? null,
    [repos, activeRepoId],
  );
  const prsForRepo = useMemo(
    () => (activeRepo ? prs : []),
    [activeRepo, prs],
  );
  const activePr = useMemo(
    () => prs.find((p) => p.id === activePrId) ?? null,
    [prs, activePrId],
  );

  // Load repos after auth.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/repos")
      .then((r) => r.json())
      .then((d: { repos: Repo[] }) => {
        if (!cancelled) setRepos(d.repos);
      })
      .catch(() => {
        if (!cancelled) setRepos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load PRs when a repo is picked.
  useEffect(() => {
    if (!activeRepo) return;
    let cancelled = false;
    fetch(`/api/repos/${activeRepo.owner}/${activeRepo.name}/prs`)
      .then((r) => r.json())
      .then((d: { prs: PR[] }) => {
        if (!cancelled) setPrs(d.prs);
      })
      .catch(() => {
        if (!cancelled) setPrs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRepo]);

  // Load diff for the active PR.
  useEffect(() => {
    if (!activeRepo || !activePr) return;
    let cancelled = false;
    fetch(`/api/repos/${activeRepo.owner}/${activeRepo.name}/prs/${activePr.number}/diff`)
      .then((r) => r.json())
      .then((d: { diffs: FileDiff[] }) => {
        if (!cancelled) setFileDiffs(d.diffs);
      })
      .catch(() => {
        if (!cancelled) setFileDiffs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRepo, activePr]);

  // TODO: replace mock issue stream with POST /api/review on the loaded diff.
  // Reset is folded into the interval effect: the initial setState for the
  // streaming mock runs inside the timer callback, not the effect body.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let i = 0;
    const mockIssues = activePrId ? ISSUES[activePrId] ?? [] : [];
    const start = () => {
      setStreamedIds([]);
      setActiveIssueId(null);
      setIssues(mockIssues);
      if (mockIssues.length === 0) {
        setIsStreaming(false);
        return;
      }
      setIsStreaming(true);
      timer = setInterval(() => {
        if (i >= mockIssues.length) {
          if (timer) clearInterval(timer);
          setIsStreaming(false);
          return;
        }
        const id = mockIssues[i]?.id ?? "";
        setStreamedIds((prev) => [...prev, id]);
        i += 1;
      }, 650);
    };
    const kickoff = setTimeout(start, 0);
    return () => {
      clearTimeout(kickoff);
      if (timer) clearInterval(timer);
    };
  }, [activePrId]);

  const onPickRepo = useCallback(
    (id: string) => {
      setActiveRepoId(id);
      setActivePrId(null);
    },
    [],
  );

  const onPickPR = useCallback((pr: PR) => {
    setActivePrId(pr.id);
  }, []);

  const signOut = useCallback(() => {
    fetch("/api/auth/signout", { method: "POST" }).then(() => {
      setUser(null);
      setRepos(null);
      setPrs([]);
      setActiveRepoId(null);
      setActivePrId(null);
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
        <AuthGate onSignIn={() => {
          window.location.href = "/api/auth/github";
        }} />
      </>
    );
  }

  return (
    <div className="code-review-workspace flex h-screen flex-col bg-[var(--bg-base)]">
      <Header user={{ login: user.login, avatar: user.avatar_url }} onSignOut={signOut} />
      <div className="flex min-h-0 flex-1">
        <RepoRail
          repos={repos && repos.length > 0 ? repos : REPOS}
          activeRepoId={activeRepoId}
          prs={prsForRepo}
          activePrId={activePrId}
          onPickRepo={onPickRepo}
          onPickPR={onPickPR}
        />
        <main className="code-review-main flex min-w-0 flex-1">
          <section className="flex h-full min-w-0 flex-1 flex-col border-r border-[var(--border-default)]">
            {activePr ? (
              <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-4 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-medium">
                      <span className="font-mono text-[var(--accent)]">#{activePr.number}</span>
                      <span className="truncate">{activePr.title}</span>
                      <span className="hidden text-[11px] text-[var(--text-muted)] sm:inline">
                        · {activePr.branch}
                      </span>
                    </div>
                    {activePr.additions !== undefined ? (
                      <div className="mt-0.5 tabnum text-[11px] text-[var(--text-muted)]">
                        <span className="text-[#7ee787]">+{activePr.additions}</span>{" "}
                        <span className="text-[#ffa198]">-{activePr.deletions}</span>
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                      isStreaming ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--sev-low)]/15 text-[var(--sev-low)]"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {isStreaming ? "Reviewing" : "Finished"}
                  </span>
                </div>
              </div>
            ) : null}
            <DiffView
              files={activePr ? (fileDiffs.length > 0 ? fileDiffs : FILE_DIFFS[activePr.id] ?? []) : []}
              activeIssueId={activeIssueId}
              onLineClick={(id) => setActiveIssueId(id)}
            />
          </section>
          <IssueCards
            issues={issues}
            streamedIds={streamedIds}
            activeId={activeIssueId}
            isStreaming={isStreaming}
            onPick={setActiveIssueId}
          />
        </main>
      </div>
    </div>
  );
}
