"use client";

import { useState } from "react";
import type { Issue, Severity } from "@/lib/types";

const SEV_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
const SEV_COLOR: Record<Severity | "open", string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
  open: "var(--text-muted)",
};

function IssueCard({
  issue,
  isActive,
  onClick,
  wasNew,
}: {
  issue: Issue;
  isActive: boolean;
  onClick: (id: string) => void;
  wasNew: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = issue.severity;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(issue.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(issue.id);
        }
      }}
      aria-pressed={isActive}
      aria-label={`Issue: ${issue.title}`}
      className={[
        "group relative cursor-pointer rounded-md border bg-[var(--bg-panel)] p-3 transition-colors",
        isActive
          ? "border-[var(--border-accent)] ring-1 ring-[var(--accent)]"
          : "border-[var(--border-default)] hover:bg-[var(--bg-raised)]",
        wasNew ? "iss-card-in" : "",
        isActive ? "card-sev-pulse" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        isActive
          ? ({ "--flash-bg": SEV_COLOR[sev] } as React.CSSProperties)
          : undefined
      }
    >
      {/* severity rail */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: SEV_COLOR[sev] }}
      />
      <div className="pl-2">
        <header className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              color: SEV_COLOR[sev],
              background: `${SEV_COLOR[sev]}1a`,
            }}
          >
            {SEV_LABEL[sev]}
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            line {issue.startLine}
          </span>
          {issue.status === "resolved" ? (
            <span className="ml-auto text-[10px] text-[var(--sev-low)]">resolved</span>
          ) : null}
        </header>
        <h4 className="mt-2 text-[13px] font-medium leading-[1.4] text-[var(--text-primary)]">
          {issue.title}
        </h4>
        <p className="mt-1 line-clamp-3 text-[12px] leading-[1.55] text-[var(--text-secondary)]">
          {issue.why}
        </p>
        <div className="mt-2 border-t border-[var(--border-default)] pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            aria-expanded={expanded}
            className={`text-[11px] ${expanded ? "text-[var(--text-muted)]" : "text-[var(--accent)] hover:text-[var(--accent-hover)]"}`}
          >
            {expanded ? "Hide fix" : "View fix"}
          </button>
          {expanded ? (
            <pre className="mt-1 overflow-x-auto rounded bg-[var(--bg-base)] p-2 font-mono text-[11px] leading-[1.55] text-[var(--text-secondary)]">
              {issue.fix}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function IssueCards({
  issues,
  streamedIds,
  activeId,
  isStreaming,
  onPick,
}: {
  issues: Issue[];
  streamedIds: string[];
  activeId: string | null;
  isStreaming: boolean;
  onPick: (id: string) => void;
}) {
  if (issues.length === 0) return null;

  const high = issues.filter((i) => i.severity === "high" && streamedIds.includes(i.id)).length;
  const med = issues.filter((i) => i.severity === "medium" && streamedIds.includes(i.id)).length;
  const low = issues.filter((i) => i.severity === "low" && streamedIds.includes(i.id)).length;

  return (
    <aside
      aria-label="AI review output"
      className="code-review-cards issue-cards flex h-full w-[380px] flex-shrink-0 flex-col border-l border-[var(--border-default)] bg-[var(--bg-panel)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          AI Review
        </h3>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          {isStreaming ? "streaming" : "done"}
        </span>
      </div>
      <div className="flex items-center gap-4 border-b border-[var(--border-default)] px-4 py-2">
        <Stat label="High" n={high} color="var(--sev-high)" />
        <Stat label="Med" n={med} color="var(--sev-medium)" />
        <Stat label="Low" n={low} color="var(--sev-low)" />
        <Stat label="Total" n={high + med + low} color="var(--text-primary)" />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {issues
          .filter((i) => streamedIds.includes(i.id))
          .map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isActive={activeId === issue.id}
              onClick={(id) => onPick(id)}
              wasNew={true}
            />
          ))}
      </div>
    </aside>
  );
}

function Stat({
  label,
  n,
  color,
}: {
  label: string;
  n: number;
  color: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-[16px] font-semibold tabnum"
        style={{ color }}
      >
        {n}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
