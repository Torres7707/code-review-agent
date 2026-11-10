"use client";

import { useState } from "react";
import type { ReviewCoverage } from "@/lib/review-core";
import { isComplete, type ReviewStatus } from "@/lib/review-status";
import type { Issue, Severity } from "@/lib/types";

const SEV_LABEL: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };
const SEV_COLOR: Record<Severity, string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

const STATUS_TEXT: Record<ReviewStatus, string> = {
  idle: "idle",
  ready: "not run",
  streaming: "streaming",
  done: "done",
  cached: "cached",
  stopped: "stopped",
  error: "error",
};

function shortPath(path: string): string {
  const parts = path.split("/");
  return parts.length <= 2 ? path : `…/${parts.slice(-2).join("/")}`;
}

function locationLabel(issue: Issue): string {
  if (issue.anchor === "none") return `${shortPath(issue.file) || "unknown file"}:${issue.reportedLine}`;
  const prefix = issue.anchor === "approx" ? "≈" : "";
  return `${shortPath(issue.file)}:${prefix}${issue.line}`;
}

function locationTitle(issue: Issue): string {
  if (issue.anchor === "none") return `${issue.file}: not part of this diff`;
  if (issue.anchor === "approx") {
    return `${issue.file}: the model reported line ${issue.reportedLine}; the nearest matching diff line is ${issue.line}`;
  }
  return `${issue.file}, line ${issue.line}`;
}

function IssueCard({
  issue,
  isActive,
  onPick,
}: {
  issue: Issue;
  isActive: boolean;
  onPick: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const color = SEV_COLOR[issue.severity];
  const fixId = `fix-${issue.id}`;

  const copyFix = () => {
    void navigator.clipboard?.writeText(issue.fix).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <article
      data-card-id={issue.id}
      className={[
        "iss-card-in relative rounded-md border bg-[var(--bg-panel)] transition-colors",
        isActive
          ? "card-sev-pulse border-[var(--border-accent)] ring-1 ring-[var(--accent)]"
          : "border-[var(--border-default)] hover:bg-[var(--bg-raised)]",
      ].join(" ")}
      style={isActive ? ({ "--flash-bg": color } as React.CSSProperties) : undefined}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-0 top-3 w-[3px] rounded-full"
        style={{ background: color }}
      />
      {/* The card body is one real button; the fix controls sit beside it. */}
      <button
        type="button"
        onClick={() => onPick(issue.id)}
        aria-pressed={isActive}
        className="block w-full rounded-md p-3 pl-5 text-left"
      >
        <span className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
          >
            {SEV_LABEL[issue.severity]}
          </span>
          <span className="truncate font-mono text-[11px] text-[var(--text-muted)]" title={locationTitle(issue)}>
            {locationLabel(issue)}
          </span>
          {issue.anchor === "approx" ? <span className="sr-only">(approximate location)</span> : null}
        </span>
        <span className="mt-2 block text-[13px] font-medium leading-[1.4] text-[var(--text-primary)]">
          {issue.title}
        </span>
        <span className="mt-1 block line-clamp-3 text-[12px] leading-[1.55] text-[var(--text-secondary)]">
          {issue.why}
        </span>
      </button>
      {issue.fix ? (
        <div className="mx-3 mb-2 ml-5 border-t border-[var(--border-default)] pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls={fixId}
              className={`text-[11px] ${expanded ? "text-[var(--text-muted)]" : "text-[var(--accent)] hover:text-[var(--accent-hover)]"}`}
            >
              {expanded ? "Hide fix" : "View fix"}
            </button>
            {expanded ? (
              <button
                type="button"
                onClick={copyFix}
                className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>
          {expanded ? (
            <pre
              id={fixId}
              className="mt-1 overflow-x-auto rounded bg-[var(--bg-base)] p-2 font-mono text-[11px] leading-[1.55] text-[var(--text-secondary)]"
            >
              {issue.fix}
            </pre>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function StatFilter({
  label,
  n,
  color,
  pressed,
  onClick,
}: {
  label: string;
  n: number;
  color: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex items-baseline gap-1.5 rounded px-1.5 py-0.5 ${pressed ? "bg-[var(--bg-raised)] ring-1 ring-[var(--border-default)]" : "hover:bg-[var(--bg-raised)]"}`}
    >
      <span className="tabnum text-[16px] font-semibold" style={{ color }}>
        {n}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
    </button>
  );
}

function CoverageNote({ coverage }: { coverage: ReviewCoverage }) {
  const extras: string[] = [];
  if (coverage.truncated > 0) extras.push(`${coverage.truncated} truncated`);
  if (coverage.overLimit > 0) extras.push(`${coverage.overLimit} over the file limit`);
  if (coverage.noPatch > 0) extras.push(`${coverage.noPatch} without a diff`);
  return (
    <p className={`text-[11px] ${extras.length > 0 ? "text-[var(--sev-medium)]" : "text-[var(--text-muted)]"}`}>
      Reviewed {coverage.reviewed} of {coverage.total} files
      {extras.length > 0 ? ` · ${extras.join(" · ")}` : ""}
    </p>
  );
}

export function IssueCards({
  issues,
  counts,
  totalIssues,
  status,
  errorMessage,
  summary,
  coverage,
  activeId,
  severityFilter,
  onFilter,
  onPick,
  onRetry,
}: {
  issues: Issue[];
  counts: Record<Severity, number>;
  totalIssues: number;
  status: ReviewStatus;
  errorMessage?: string;
  summary?: string;
  coverage: ReviewCoverage | null;
  activeId: string | null;
  severityFilter: Severity | null;
  onFilter: (severity: Severity | null) => void;
  onPick: (id: string) => void;
  onRetry?: () => void;
}) {
  const toggle = (sev: Severity) => onFilter(severityFilter === sev ? null : sev);
  const showStats = status !== "idle" && status !== "ready";

  return (
    <aside
      aria-label="AI review output"
      className="code-review-cards flex h-full w-[380px] flex-shrink-0 flex-col border-l border-[var(--border-default)] bg-[var(--bg-panel)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          AI Review
        </h2>
        <span
          className={`font-mono text-[11px] ${status === "error" ? "text-[var(--sev-high)]" : "text-[var(--text-muted)]"}`}
        >
          {STATUS_TEXT[status]}
        </span>
      </div>

      {showStats ? (
        <div
          aria-live="polite"
          className="flex items-center gap-2 border-b border-[var(--border-default)] px-3 py-2"
        >
          <StatFilter label="High" n={counts.high} color={SEV_COLOR.high} pressed={severityFilter === "high"} onClick={() => toggle("high")} />
          <StatFilter label="Med" n={counts.medium} color={SEV_COLOR.medium} pressed={severityFilter === "medium"} onClick={() => toggle("medium")} />
          <StatFilter label="Low" n={counts.low} color={SEV_COLOR.low} pressed={severityFilter === "low"} onClick={() => toggle("low")} />
          <span className="ml-auto flex items-baseline gap-1.5 px-1.5">
            <span className="tabnum text-[16px] font-semibold text-[var(--text-primary)]">{totalIssues}</span>
            <span className="text-[11px] text-[var(--text-muted)]">Total</span>
          </span>
        </div>
      ) : null}

      {showStats && (summary || coverage) ? (
        <div className="space-y-1 border-b border-[var(--border-default)] px-4 py-2">
          {summary ? (
            <p className="text-[12px] leading-[1.55] text-[var(--text-secondary)]">{summary}</p>
          ) : null}
          {coverage ? <CoverageNote coverage={coverage} /> : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {status === "idle" ? (
          <p className="p-3 text-[12px] text-[var(--text-muted)]">
            Pick a pull request to start a review.
          </p>
        ) : null}
        {status === "ready" ? (
          <p className="p-3 text-[12px] text-[var(--text-muted)]">This pull request has not been reviewed yet.</p>
        ) : null}
        {status === "streaming" && totalIssues === 0 ? (
          <p role="status" className="p-3 text-[12px] text-[var(--text-muted)]">
            Reviewing the diff…
          </p>
        ) : null}

        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} isActive={activeId === issue.id} onPick={onPick} />
        ))}

        {severityFilter && totalIssues > 0 && issues.length === 0 ? (
          <p className="p-3 text-[12px] text-[var(--text-muted)]">
            No {SEV_LABEL[severityFilter].toLowerCase()} severity issues.
          </p>
        ) : null}

        {status === "stopped" ? (
          <p className="rounded-md border border-[var(--sev-medium)]/40 bg-[var(--sev-medium)]/10 p-3 text-[12px] text-[var(--sev-medium)]">
            Review stopped. The results above may be incomplete.
          </p>
        ) : null}
        {status === "error" ? (
          <div
            role="alert"
            className="rounded-md border border-[var(--sev-high)]/40 bg-[var(--sev-high)]/10 p-3 text-[12px] text-[var(--sev-high)]"
          >
            <p>{errorMessage ?? "The review failed."}</p>
          </div>
        ) : null}
        {(status === "stopped" || status === "error") && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-[var(--border-default)] px-3 py-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
          >
            Try again
          </button>
        ) : null}

        {isComplete(status) && totalIssues === 0 ? (
          <p className="p-3 text-[12px] text-[var(--text-muted)]">No problems found.</p>
        ) : null}
      </div>
    </aside>
  );
}
