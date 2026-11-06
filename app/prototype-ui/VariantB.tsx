"use client";

import { ReviewStream } from "./ReviewStream";
import type { ReviewUiProps } from "./types";

/** B — Split IDE: code left, live review right, action strip on the code pane. */
export const VARIANT_NAME = "Split IDE";

export function VariantB({
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
    <div className="flex h-screen flex-col bg-[#0e1116] text-[#d7dde5]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-xs tracking-widest uppercase text-white/50">
            review.session
          </span>
        </div>
        <span className="font-mono text-[11px] text-white/35">
          {isBusy ? "● streaming" : "○ ready"}
        </span>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col border-r border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
              editor · jsx
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded bg-[#3d8bfd] px-3 py-1 font-mono text-xs font-medium text-white disabled:opacity-40"
                onClick={() => {
                  if (error) onClearError();
                  onReview();
                }}
                disabled={isBusy || !input.trim()}
              >
                Run review
              </button>
              <button
                type="button"
                className="rounded border border-white/20 px-3 py-1 font-mono text-xs text-white/70 disabled:opacity-40"
                onClick={onStop}
                disabled={!isBusy}
              >
                Abort
              </button>
            </div>
          </div>
          <textarea
            className="min-h-0 flex-1 resize-none bg-[#0e1116] p-4 font-mono text-[13px] leading-relaxed text-[#d7dde5] outline-none placeholder:text-white/25"
            placeholder="// drop component source here"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </section>

        <section className="flex min-h-0 flex-col bg-[#12161d]">
          <div className="border-b border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white/40">
            agent output
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28">
            {error ? (
              <p className="mb-3 border border-red-500/40 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-200">
                {error.message}
              </p>
            ) : null}
            <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-black/40">
              <ReviewStream messages={messages} />
              {!messages.some((m) => m.role === "assistant") && !isBusy ? (
                <p className="font-mono text-xs text-white/30">
                  Findings stream here after Run review.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
