"use client";

import { memo, useState } from "react";
import type { DiffLine, FileDiff, ReviewScope, Severity } from "@/lib/types";

const SEV_LETTER: Record<Severity, string> = { high: "H", medium: "M", low: "L" };

const LINE_TONE: Record<Exclude<DiffLine["type"], "hunk">, string> = {
  add: "bg-[var(--diff-add-bg)] text-[var(--diff-add-fg)]",
  del: "bg-[var(--diff-del-bg)] text-[var(--diff-del-fg)]",
  context: "text-[var(--text-secondary)]",
};

const SCOPE_NOTE: Partial<Record<ReviewScope, string>> = {
  truncated: "Patch too long: only the first part of this file was reviewed.",
  "over-limit": "Not reviewed: this PR has more files than the review limit.",
};

function LineRow({
  line,
  isActive,
  onLineClick,
}: {
  line: DiffLine;
  isActive: boolean;
  onLineClick: (issueId: string) => void;
}) {
  if (line.type === "hunk") {
    return (
      <div className="flex w-full bg-[var(--bg-panel)]/60 px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
        <span className="w-[100px] flex-shrink-0" aria-hidden="true" />
        <span className="whitespace-pre px-3">{line.content}</span>
      </div>
    );
  }

  const issueId = line.issueId;
  const sev = line.severity;
  const lineNo = line.newNo ?? line.oldNo;
  const activate = issueId ? () => onLineClick(issueId) : undefined;
  const sign = line.type === "add" ? "+" : line.type === "del" ? "-" : " ";

  return (
    <div
      role={issueId ? "button" : undefined}
      tabIndex={issueId ? 0 : undefined}
      data-issue-id={issueId ?? undefined}
      data-line-no={lineNo}
      onClick={activate}
      onKeyDown={
        activate
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activate();
              }
            }
          : undefined
      }
      aria-label={
        issueId && sev
          ? `${sev} severity issue on line ${lineNo}: ${line.issueTitle ?? ""}`
          : undefined
      }
      aria-pressed={issueId ? isActive : undefined}
      className={[
        "flex w-full px-2",
        LINE_TONE[line.type],
        isActive
          ? "flash-sev cursor-pointer ring-2 ring-inset ring-[var(--flash-bg)]"
          : issueId
            ? "cursor-pointer hover:bg-white/5"
            : "",
      ].join(" ")}
      style={sev ? ({ "--flash-bg": `var(--sev-${sev})` } as React.CSSProperties) : undefined}
    >
      <span className="flex w-5 flex-shrink-0 items-center justify-center" aria-hidden="true">
        {sev ? (
          <span
            className="rounded-sm px-[3px] text-[9px] font-bold leading-[14px] text-[#0d1117]"
            style={{ background: `var(--sev-${sev})` }}
          >
            {SEV_LETTER[sev]}
          </span>
        ) : null}
      </span>
      <span className="w-10 flex-shrink-0 select-none text-right text-[11px] tabnum opacity-70">
        {line.oldNo ?? ""}
      </span>
      <span className="w-10 flex-shrink-0 select-none text-right text-[11px] tabnum opacity-70">
        {line.newNo ?? ""}
      </span>
      <span className="w-4 flex-shrink-0 select-none text-center text-[12px] leading-[20px] opacity-70" aria-hidden="true">
        {sign}
      </span>
      <span className="flex-1 whitespace-pre pr-3 text-[12px] leading-[20px]">{line.content}</span>
    </div>
  );
}

const FileDiffBlock = memo(function FileDiffBlock({
  file,
  activeIssueId,
  onLineClick,
}: {
  file: FileDiff;
  activeIssueId: string | null;
  onLineClick: (issueId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const note = SCOPE_NOTE[file.scope];
  const bodyId = `diff-${file.path.replace(/[^A-Za-z0-9_-]/g, "-")}`;

  return (
    <section className="border-b border-black/40" data-file-path={file.path}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-4 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <span aria-hidden="true" className="w-3 text-[10px] text-[var(--text-muted)]">
            {collapsed ? "▸" : "▾"}
          </span>
          <span className="truncate font-mono text-[13px]">{file.path}</span>
        </button>
        <span className="tabnum flex-shrink-0 text-[11px]">
          <span className="text-[var(--diff-add-fg)]">+{file.additions}</span>{" "}
          <span className="text-[var(--diff-del-fg)]">-{file.deletions}</span>
        </span>
      </div>
      {!collapsed ? (
        <div id={bodyId}>
          {note ? (
            <p className="bg-[var(--sev-medium)]/10 px-4 py-1 text-[11px] text-[var(--sev-medium)]">
              {note}
            </p>
          ) : null}
          {file.scope === "no-patch" ? (
            <p className="px-4 py-3 text-[12px] text-[var(--text-muted)]">
              Binary, too large, or renamed without changes. GitHub provides no diff to show or review.
            </p>
          ) : (
            <div className="overflow-x-auto bg-[var(--bg-base)] py-2 font-mono">
              <div className="inline-block min-w-full">
                {file.lines.map((l, i) => (
                  <LineRow
                    key={i}
                    line={l}
                    isActive={activeIssueId !== null && l.issueId === activeIssueId}
                    onLineClick={onLineClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
});

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--bg-base)] px-8 text-center">
      <div className="rounded-lg border-2 border-dashed border-[var(--border-default)] px-8 py-6 text-[13px] text-[var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}

export function DiffView({
  files,
  activeIssueId,
  onLineClick,
  loading = false,
  error = null,
  onRetry,
  emptyMessage,
}: {
  files: FileDiff[];
  activeIssueId: string | null;
  onLineClick: (issueId: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <Placeholder>
        <p role="status">Loading diff…</p>
      </Placeholder>
    );
  }
  if (error) {
    return (
      <Placeholder>
        <p role="alert" className="text-[var(--sev-high)]">Could not load the diff: {error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md border border-[var(--border-default)] px-3 py-1 text-[12px] hover:bg-[var(--bg-raised)]"
          >
            Retry
          </button>
        ) : null}
      </Placeholder>
    );
  }
  if (files.length === 0) {
    return (
      <Placeholder>
        <p>{emptyMessage}</p>
      </Placeholder>
    );
  }
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-base)]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {files.map((f) => (
          <FileDiffBlock
            key={f.path}
            file={f}
            activeIssueId={activeIssueId}
            onLineClick={onLineClick}
          />
        ))}
      </div>
    </div>
  );
}
