"use client";

import type { PR, Repo } from "@/lib/types";

function RepoRow({
  repo,
  active,
  onClick,
}: {
  repo: Repo;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={[
        "group flex w-full items-start gap-2 px-3 py-2 text-left",
        "transition-colors",
        active
          ? "bg-[var(--accent)]/15 text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      <span
        className={[
          "mt-[3px] h-4 w-1 flex-shrink-0 rounded-full",
          active ? "bg-[var(--accent)]" : "bg-transparent",
        ].join(" ")}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium leading-[1.4]">
          {repo.name}
        </span>
        <span className="block truncate text-[11px] text-[var(--text-muted)]">
          {repo.language} · ★ {repo.stars.toLocaleString()}
        </span>
      </span>
    </button>
  );
}

function PRRow({
  pr,
  active,
  onClick,
}: {
  pr: PR;
  active: boolean;
  onClick: () => void;
}) {
  const timeLabel = pr.hoursAgo !== undefined
    ? `${pr.hoursAgo}h ago`
    : pr.updatedAt
      ? new Date(pr.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={[
        "group flex w-full items-start gap-2 px-3 py-2 text-left",
        "transition-colors",
        active
          ? "bg-[var(--accent)]/15 text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
      ].join(" ")}
    >
      <span
        className={[
          "mt-[3px] h-4 w-1 flex-shrink-0 rounded-full",
          active ? "bg-[var(--accent)]" : "bg-transparent",
        ].join(" ")}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono font-medium text-[12px]">
            #{pr.number}
          </span>
          <span className="truncate text-[12px] leading-[1.4]">
            {pr.title}
          </span>
        </span>
        <span className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>{pr.author}</span>
          <span>·</span>
          <span>{timeLabel}</span>
          {pr.additions !== undefined ? (
            <span className="ml-auto flex items-center gap-1">
              <span className="tabnum text-[#7ee787]">+{pr.additions}</span>
              <span className="tabnum text-[#ffa198]">-{pr.deletions}</span>
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function RepoRail({
  repos,
  activeRepoId,
  prs,
  activePrId,
  onPickRepo,
  onPickPR,
}: {
  repos: Repo[];
  activeRepoId: string | null;
  prs: PR[];
  activePrId: string | null;
  onPickRepo: (id: string) => void;
  onPickPR: (pr: PR) => void;
}) {
  return (
    <nav
      aria-label="Repos and PRs"
      className="code-review-rail flex h-full w-[240px] flex-shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-panel)] text-left"
    >
      <div className="px-4 pt-4 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Repos
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4" role="listbox" aria-label="Your repositories">
        {repos.length === 0 ? (
          <p className="px-4 py-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
            No repositories yet. Push a repo on GitHub and it will show up here.
          </p>
        ) : null}
        {repos.map((r) => (
          <div key={r.id} role="option" aria-selected={activeRepoId === r.id}>
            <RepoRow
              repo={r}
              active={activeRepoId === r.id}
              onClick={() => onPickRepo(r.id)}
            />
            {activeRepoId === r.id && prs.length > 0 ? (
              <div className="ml-4 border-l border-[var(--border-default)] pl-2">
                {prs.map((p) => (
                  <PRRow
                    key={p.id}
                    pr={p}
                    active={activePrId === p.id}
                    onClick={() => onPickPR(p)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </nav>
  );
}
