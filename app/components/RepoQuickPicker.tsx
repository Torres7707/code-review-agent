"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Repo } from "@/lib/types";

type RepoPickerProps = {
  repos: Repo[];
  activeRepoId: string | null;
  onPickRepo: (id: string) => void;
};

const LANGUAGE_TONE: Record<string, string> = {
  TypeScript: "text-[#3178c6]",
  JavaScript: "text-[#f1e05a]",
  Rust: "text-[#dea584]",
  Python: "text-[#3572A5]",
  Go: "text-[#00ADD8]",
};

function relativeAge(updatedAt: string | undefined): string {
  if (!updatedAt) return "";
  const then = Date.parse(updatedAt);
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Quick-jump palette: type to filter repos, arrow keys to move, Enter to open
 * that repo's pull requests. Sits above the rail so it works from anywhere in
 * the workspace.
 */
export function RepoQuickPicker({ repos, activeRepoId, onPickRepo }: RepoPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const filtered = repos.filter((repo) => {
      const label = `${repo.owner}/${repo.name}`.toLocaleLowerCase();
      return needle.length === 0 || label.includes(needle);
    });
    return filtered.slice(0, 8);
  }, [repos, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const choose = (repo: Repo) => {
    onPickRepo(repo.id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative px-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-[var(--border-default)] px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
      >
        <span>Jump to repo</span>
        <kbd className="ml-auto rounded border border-[var(--border-default)] px-1 text-[10px]">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="absolute left-3 right-3 z-20 mt-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-raised)] p-1 shadow-lg">
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                setCursor((c) => Math.min(c + 1, matches.length - 1));
              }
              if (e.key === "ArrowUp") {
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && matches[cursor]) choose(matches[cursor]);
            }}
            placeholder="Filter repos…"
            className="w-full rounded bg-[var(--bg-base)] px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none"
          />
          <ul className="mt-1">
            {matches.map((repo, index) => (
              <li key={repo.id}>
                <button
                  type="button"
                  onClick={() => choose(repo)}
                  className={[
                    "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[12px]",
                    index === cursor
                      ? "bg-[var(--accent)]/20 text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]",
                    repo.id === activeRepoId ? "font-medium" : "",
                  ].join(" ")}
                >
                  <span className={LANGUAGE_TONE[repo.language ?? ""] ?? "text-[var(--text-muted)]"}>
                    {repo.language ?? "—"}
                  </span>
                  <span className="truncate">{repo.name}</span>
                  <span className="ml-auto tabnum text-[11px] text-[var(--text-muted)]">
                    {relativeAge(repo.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 ? (
              <li className="px-2 py-1 text-[11px] text-[var(--text-muted)]">No repos match.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
