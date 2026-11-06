"use client";

import { ReviewStream } from "./ReviewStream";
import type { ReviewUiProps } from "./types";

/** A — Stacked workspace: editor owns the page; findings drop below. */
export const VARIANT_NAME = "Stacked workspace";

export function VariantA({
  input,
  setInput,
  messages,
  isBusy,
  error,
  onReview,
  onStop,
  onClearError,
}: ReviewUiProps) {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#1a1814]">
      <header className="border-b border-[#1a1814]/12 px-6 py-5">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.2em] uppercase opacity-60">
          Code review agent
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-3xl font-semibold tracking-tight">
          Paste. Review. Ship cleaner React.
        </h1>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8 pb-28">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-xs tracking-wide uppercase opacity-60">
            Source
          </span>
          <textarea
            className="h-72 w-full resize-y rounded-sm border border-[#1a1814]/25 bg-white p-4 font-mono text-sm leading-relaxed outline-none focus:border-[#1a1814]"
            placeholder="Paste a React component…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-sm bg-[#c45c26] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            onClick={() => {
              if (error) onClearError();
              onReview();
            }}
            disabled={isBusy || !input.trim()}
          >
            {isBusy ? "Reviewing…" : "Review"}
          </button>
          <button
            type="button"
            className="rounded-sm border border-[#1a1814]/30 px-5 py-2.5 text-sm disabled:opacity-40"
            onClick={onStop}
            disabled={!isBusy}
          >
            Stop
          </button>
          <span className="font-mono text-xs opacity-50">
            {isBusy ? "streaming findings" : "idle"}
          </span>
        </div>

        {error ? (
          <p className="border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.message}
          </p>
        ) : null}

        <section className="min-h-40 border border-[#1a1814]/15 bg-white p-5">
          <h2 className="mb-3 font-mono text-xs tracking-wide uppercase opacity-60">
            Findings
          </h2>
          <div className="prose prose-sm max-w-none">
            <ReviewStream messages={messages} />
            {!messages.some((m) => m.role === "assistant") && !isBusy ? (
              <p className="text-sm opacity-40">Review output appears here.</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
