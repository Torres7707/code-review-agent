"use client";

import type { DiffLine, FileDiff } from "@/lib/types";

function LineRow({
  line,
  isFlashing,
  onLineClick,
}: {
  line: DiffLine;
  isFlashing: boolean;
  onLineClick: (issueId: string, lineNo: number) => void;
}) {
  const bg =
    line.type === "add"
      ? "bg-[#1e3a29] text-[#7ee787]"
      : line.type === "del"
        ? "bg-[#490194] text-[#ffa198]"
        : "text-[var(--text-secondary)]";
  const interactive = line.issueId !== null;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive
          ? () => onLineClick(line.issueId!, line.newNo ?? line.oldNo ?? 0)
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter")
                onLineClick(line.issueId!, line.newNo ?? line.oldNo ?? 0);
            }
          : undefined
      }
      aria-label={
        interactive
          ? `Jump to issue ${line.issueId} on line ${line.newNo ?? line.oldNo}`
          : undefined
      }
      className={[
        "flex px-2",
        bg,
        isFlashing
          ? "flash-sev ring-2 ring-inset ring-[var(--flash-bg)] cursor-pointer"
          : interactive
            ? "cursor-pointer hover:bg-white/5"
            : "cursor-default",
      ].join(" ")}
      style={isFlashing && line.severity ? { "--flash-bg": `var(--sev-${line.severity})` } as Record<string, string> : undefined}
    >
      <span className="w-10 flex-shrink-0 select-none text-right text-[11px] tabnum opacity-50">
        {line.oldNo ?? ""}
      </span>
      <span className="w-10 flex-shrink-0 select-none text-right text-[11px] tabnum opacity-50">
        {line.newNo ?? ""}
      </span>
      <span className="flex-1 whitespace-pre px-3 text-[12px] leading-[20px]">
        {line.content}
      </span>
      {isFlashing && line.severity ? (
        <span
          className="ml-2 flex-shrink-0 rounded px-1.5 py-px text-[10px] font-medium uppercase tracking-wide"
          style={{
            background: "var(--flash-bg)",
            color: "#0d1117",
          }}
        >
          {line.severity}
        </span>
      ) : null}
    </div>
  );
}

function FileDiffBlock({
  file,
  activeIssueId,
  onLineClick,
}: {
  file: FileDiff;
  activeIssueId: string | null;
  onLineClick: (issueId: string, lineNo: number) => void;
}) {
  return (
    <section className="border-b border-black/40">
      <div className="flex items-center gap-3 bg-[var(--bg-panel)] px-4 py-2">
        <svg
          className="h-4 w-4 text-[var(--text-secondary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 7v10.5c0 2-2 3.5-5 3.5S4 19.5 4 17.5V7m10 0v10.5c0 2-2 3.5-5 3.5S4 19.5 4 17.5V7" />
        </svg>
        <span className="font-mono text-[13px]">{file.path}</span>
        <span className="tabnum text-[11px] text-[var(--text-muted)]">
          <span className="text-[#7ee787]"> +{file.additions}</span>{" "}
          <span className="text-[#ffa198]">-{file.deletions}</span>
        </span>
      </div>
      <div className="bg-[var(--bg-panel)]/60 px-3 py-1 font-mono text-[11px] text-[var(--text-muted)]">
        {file.path === "src/app/page.tsx"
          ? "@@ -20,7 +22,9 @@"
          : file.path === "src/lib/useUser.ts"
            ? "@@ -0,0 +1,12 @@"
            : "@@ -1,13 +1,13 @@"}
      </div>
      <pre className="overflow-visible bg-[var(--bg-base)] py-2">
        <code className="font-mono">
          {file.lines.map((l, i) => (
            <LineRow
              key={i}
              line={l}
              isFlashing={activeIssueId === l.issueId}
              onLineClick={onLineClick}
            />
          ))}
        </code>
      </pre>
    </section>
  );
}

export function DiffView({
  files,
  activeIssueId,
  onLineClick,
}: {
  files: FileDiff[];
  activeIssueId: string | null;
  onLineClick: (issueId: string, lineNo: number) => void;
}) {
  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--bg-base)] px-8 text-center">
        <div className="border-2 border-dashed border-[var(--border-default)] rounded-lg px-8 py-6">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Pick a PR from the left rail to see its diff.
          </p>
        </div>
      </div>
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
