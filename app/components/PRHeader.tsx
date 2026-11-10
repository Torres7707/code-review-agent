"use client";

import { STATUS_LABEL, type ReviewStatus } from "@/lib/review-status";
import type { PR, PRDetail } from "@/lib/types";

const STATUS_TONE: Record<ReviewStatus, string> = {
  idle: "bg-[var(--bg-raised)] text-[var(--text-muted)]",
  ready: "bg-[var(--bg-raised)] text-[var(--text-secondary)]",
  streaming: "bg-[var(--accent)]/15 text-[var(--accent)]",
  done: "bg-[var(--sev-low)]/15 text-[var(--sev-low)]",
  cached: "bg-[var(--sev-low)]/15 text-[var(--sev-low)]",
  stopped: "bg-[var(--sev-medium)]/15 text-[var(--sev-medium)]",
  error: "bg-[var(--sev-high)]/15 text-[var(--sev-high)]",
};

const BUTTON =
  "rounded-md border border-[var(--border-default)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]";

export function PRHeader({
  pr,
  detail,
  status,
  canRun,
  onRun,
  onStop,
}: {
  pr: PR | null;
  detail: PRDetail | null;
  status: ReviewStatus;
  canRun: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  if (!pr) {
    return (
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-4 py-2.5 text-[12px] text-[var(--text-muted)]">
        No pull request selected
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-4 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <span className="font-mono text-[var(--accent)]">#{pr.number}</span>
            <span className="truncate">{pr.title}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
            <span className="font-mono">{pr.branch}</span>
            {detail ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabnum">
                  <span className="text-[var(--diff-add-fg)]">+{detail.additions}</span>{" "}
                  <span className="text-[var(--diff-del-fg)]">-{detail.deletions}</span>
                  <span> · {detail.filesChanged} files</span>
                </span>
                <span aria-hidden="true">·</span>
                <a
                  href={detail.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  Open on GitHub
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {status === "streaming" ? (
            <button type="button" onClick={onStop} className={BUTTON}>
              Stop
            </button>
          ) : canRun ? (
            <button type="button" onClick={onRun} className={BUTTON}>
              {status === "ready" ? "Run review" : "Re-run review"}
            </button>
          ) : null}
          <span
            role="status"
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${STATUS_TONE[status]}`}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
