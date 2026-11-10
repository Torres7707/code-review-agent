"use client";

import Image from "next/image";

export function Header({
  user,
  onSignOut,
  railOpen,
  onToggleRail,
}: {
  user: { login: string; avatar: string } | null;
  onSignOut?: () => void;
  railOpen?: boolean;
  onToggleRail?: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-base)] px-4">
      <div className="flex items-center gap-2">
        {onToggleRail ? (
          <button
            type="button"
            onClick={onToggleRail}
            aria-expanded={railOpen}
            aria-controls="repo-rail"
            className="rail-toggle mr-1 rounded-md border border-[var(--border-default)] px-2 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
          >
            Repos
          </button>
        ) : null}
        <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
        <span className="text-[13px] font-semibold tracking-tight">Code Review Agent</span>
        <span aria-hidden="true" className="hidden text-[11px] text-[var(--text-muted)] sm:inline">·</span>
        <span className="hidden font-mono text-[11px] text-[var(--text-secondary)] sm:inline">pr-review</span>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden font-mono text-[12px] text-[var(--text-secondary)] sm:inline">
              {user.login}
            </span>
            <Image
              src={user.avatar}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border border-[var(--border-default)] object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-[var(--border-default)] px-3 py-1 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
            >
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
