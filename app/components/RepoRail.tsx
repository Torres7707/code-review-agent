"use client";

import { useId, useState } from "react";
import type { Load } from "@/lib/api-client";
import type { PR, Repo } from "@/lib/types";

const ROW =
  "group flex w-full items-start gap-2 px-3 py-2 text-left transition-colors";
const ROW_ACTIVE = "bg-[var(--accent)]/15 text-[var(--text-primary)]";
const ROW_IDLE =
  "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]";

function ActiveBar({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "mt-[3px] h-4 w-1 flex-shrink-0 rounded-full",
        active ? "bg-[var(--accent)]" : "bg-transparent",
      ].join(" ")}
    />
  );
}

function Notice({
  children,
  tone = "muted",
  onRetry,
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
  onRetry?: () => void;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`px-4 py-2 text-[11px] leading-relaxed ${tone === "error" ? "text-[var(--sev-high)]" : "text-[var(--text-muted)]"}`}
    >
      {children}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

function PRRow({ pr, active, onClick }: { pr: PR; active: boolean; onClick: () => void }) {
  const updated = new Date(pr.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`${ROW} ${active ? ROW_ACTIVE : ROW_IDLE}`}
    >
      <ActiveBar active={active} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-medium">#{pr.number}</span>
          <span className="truncate text-[12px] leading-[1.4]">{pr.title}</span>
        </span>
        <span className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>{pr.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={pr.updatedAt}>{updated}</time>
        </span>
      </span>
    </button>
  );
}

function PRList({
  prs,
  activePrNumber,
  onPickPR,
  onRetry,
}: {
  prs: Load<PR[]> | null;
  activePrNumber: number | null;
  onPickPR: (pr: PR) => void;
  onRetry: () => void;
}) {
  if (!prs || prs.status === "loading") return <Notice>Loading pull requests…</Notice>;
  if (prs.status === "error") {
    return (
      <Notice tone="error" onRetry={onRetry}>
        Could not load pull requests: {prs.message}
      </Notice>
    );
  }
  if (prs.data.length === 0) return <Notice>No open pull requests.</Notice>;
  return (
    <ul>
      {prs.data.map((p) => (
        <li key={p.id}>
          <PRRow pr={p} active={activePrNumber === p.number} onClick={() => onPickPR(p)} />
        </li>
      ))}
    </ul>
  );
}

export function RepoRail({
  open,
  repos,
  activeRepoId,
  prs,
  activePrNumber,
  onPickRepo,
  onPickPR,
  onRetryRepos,
  onRetryPrs,
}: {
  open: boolean;
  repos: Load<Repo[]>;
  activeRepoId: string | null;
  prs: Load<PR[]> | null;
  activePrNumber: number | null;
  onPickRepo: (repo: Repo) => void;
  onPickPR: (pr: PR) => void;
  onRetryRepos: () => void;
  onRetryPrs: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const q = query.trim().toLowerCase();
  const visible =
    repos.status === "ok"
      ? repos.data.filter((r) => !q || `${r.owner}/${r.name}`.toLowerCase().includes(q))
      : [];

  return (
    <nav
      id="repo-rail"
      aria-label="Repositories and pull requests"
      className={`code-review-rail flex h-full w-[240px] flex-shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-panel)] text-left ${open ? "is-open" : ""}`}
    >
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Repos
        </h2>
        <label htmlFor={searchId} className="sr-only">
          Filter repositories
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter repos…"
          className="mt-2 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-2 py-1 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {repos.status === "loading" ? <Notice>Loading repositories…</Notice> : null}
        {repos.status === "error" ? (
          <Notice tone="error" onRetry={onRetryRepos}>
            Could not load repositories: {repos.message}
          </Notice>
        ) : null}
        {repos.status === "ok" && repos.data.length === 0 ? (
          <Notice>No repositories yet. Push a repo on GitHub and it will show up here.</Notice>
        ) : null}
        {repos.status === "ok" && repos.data.length > 0 && visible.length === 0 ? (
          <Notice>No repositories match “{query}”.</Notice>
        ) : null}
        <ul>
          {visible.map((r) => {
            const active = activeRepoId === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onPickRepo(r)}
                  aria-expanded={active}
                  className={`${ROW} ${active ? ROW_ACTIVE : ROW_IDLE}`}
                >
                  <ActiveBar active={active} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium leading-[1.4]">{r.name}</span>
                    <span className="block truncate text-[11px] text-[var(--text-muted)]">
                      {[r.owner, r.language, `★ ${r.stars.toLocaleString()}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
                {active ? (
                  <div className="ml-4 border-l border-[var(--border-default)] pl-2">
                    <PRList
                      prs={prs}
                      activePrNumber={activePrNumber}
                      onPickPR={onPickPR}
                      onRetry={onRetryPrs}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
