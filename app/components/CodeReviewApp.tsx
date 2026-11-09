"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/app/components/AuthGate";
import { DiffView } from "@/app/components/DiffView";
import { Header } from "@/app/components/Header";
import { IssueCards } from "@/app/components/IssueCards";
import { RepoRail } from "@/app/components/RepoRail";
import { FILE_DIFFS, ISSUES, PRS, REPOS } from "@/lib/mock";
import type { PR } from "@/lib/mock";

const DEMO_USER = {
  login: "torreswang",
  avatar: "https://avatars.githubusercontent.com/u/14485943?v=4",
};

export function CodeReviewApp() {
  const [authed, setAuthed] = useState(false);
  const [activeRepoId, setActiveRepoId] = useState<string | null>("nextjs");
  const [activePrId, setActivePrId] = useState<string | null>("pr-4821");
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [streamedIds, setStreamedIds] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prsForRepo = useMemo(
    () => (activeRepoId ? PRS[activeRepoId] ?? [] : []),
    [activeRepoId],
  );
  const activePr = useMemo(
    () => prsForRepo.find((p) => p.id === activePrId) ?? null,
    [prsForRepo, activePrId],
  );
  const fileDiffs = useMemo(
    () => (activePrId ? FILE_DIFFS[activePrId] ?? [] : []),
    [activePrId],
  );
  const issueList = useMemo(
    () => (activePrId ? ISSUES[activePrId] ?? [] : []),
    [activePrId],
  );

  // When the active PR changes, clear state and stream issues back in.
  useEffect(() => {
    if (streamTimer.current) clearTimeout(streamTimer.current);
    setActiveIssueId(null);
    setStreamedIds([]);
    setIsStreaming(true);

    // Stream in with a 700ms stagger, one per card.
    let i = 0;
    const interval = setInterval(() => {
      if (i >= issueList.length || !issueList[i]) {
        clearInterval(interval);
        setIsStreaming(false);
        return;
      }
      setStreamedIds((prev) => [...prev, issueList[i]?.id ?? ""]);
      i += 1;
    }, 650);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePrId]);

  const onPickIssue = useCallback((id: string) => {
    setActiveIssueId((prev) => (prev === id ? null : id));
  }, []);

  const onPickPR = useCallback((pr: PR) => {
    setActivePrId(pr.id);
  }, []);

  if (!authed) {
    return (
      <>
        <Header user={null} />
        <AuthGate onSignIn={() => setAuthed(true)} />
      </>
    );
  }

  return (
    <div className="code-review-workspace flex h-screen flex-col bg-[var(--bg-base)]">
      <Header user={DEMO_USER} />
      <div className="flex min-h-0 flex-1">
        <RepoRail
          repos={REPOS}
          activeRepoId={activeRepoId}
          prs={prsForRepo}
          activePrId={activePrId}
          onPickRepo={setActiveRepoId}
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
                    <div className="mt-0.5 tabnum text-[11px] text-[var(--text-muted)]">
                      <span className="text-[#7ee787]">+{activePr.additions}</span>{" "}
                      <span className="text-[#ffa198]">-{activePr.deletions}</span>{" "}
                      · {activePr.filesChanged} files · open {activePr.hoursAgo}h ago
                    </div>
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
              files={fileDiffs}
              activeIssueId={activeIssueId}
              onLineClick={(id) => setActiveIssueId(id)}
            />
          </section>
          <IssueCards
            issues={issueList}
            streamedIds={streamedIds}
            activeId={activeIssueId}
            isStreaming={isStreaming}
            onPick={onPickIssue}
          />
        </main>
      </div>
    </div>
  );
}
