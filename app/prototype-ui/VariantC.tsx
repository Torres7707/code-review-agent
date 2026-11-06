"use client";

import { Streamdown } from "streamdown";
import type { ReviewUiProps } from "./types";

/** C — Review as chat: transcript first, compose dock pinned at bottom. */
export const VARIANT_NAME = "Chat transcript";

export function VariantC({
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
    <div className="flex min-h-screen flex-col bg-[#e8f0ea] text-[#14201a]">
      <header className="mx-auto w-full max-w-2xl px-4 pt-10 pb-4 text-center">
        <h1 className="font-[family-name:var(--font-geist-sans)] text-4xl font-semibold tracking-tight">
          Reviewer
        </h1>
        <p className="mt-2 text-sm text-[#14201a]/65">
          Drop in React code. Talk through findings like a pair session.
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pb-52">
        {messages.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-[#14201a]/20 bg-white/50 px-5 py-8 text-center text-sm text-[#14201a]/45">
            No reviews yet. Paste code below and send.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error.message}
          </div>
        ) : null}

        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-[#1f6b4a] font-mono text-[12px] leading-relaxed text-white"
                    : "bg-white text-sm"
                }`}
              >
                {!isUser && message.metadata?.createdAt ? (
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-black/40">
                    {new Date(message.metadata.createdAt).toLocaleTimeString()}
                    {message.metadata.totalTokens
                      ? ` · ${message.metadata.totalTokens} tok`
                      : ""}
                  </p>
                ) : null}
                {message.parts.map((part, index) =>
                  part.type === "text" ? (
                    isUser ? (
                      <pre
                        key={`${message.id}-${index}`}
                        className="max-h-64 overflow-auto whitespace-pre-wrap"
                      >
                        {part.text}
                      </pre>
                    ) : (
                      <div
                        key={`${message.id}-${index}`}
                        className="prose prose-sm max-w-none"
                      >
                        <Streamdown isAnimating={part.state === "streaming"}>
                          {part.text}
                        </Streamdown>
                      </div>
                    )
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
      </main>

      <div className="fixed inset-x-0 bottom-16 z-40 px-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 rounded-3xl border border-[#14201a]/15 bg-white p-3 shadow-lg">
          <textarea
            className="h-28 w-full resize-none rounded-2xl bg-[#f3f7f4] p-3 font-mono text-sm outline-none"
            placeholder="Paste React code to review…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[11px] text-[#14201a]/45">
              {isBusy ? "agent typing…" : "ready"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-[#14201a]/20 px-4 py-1.5 text-sm disabled:opacity-40"
                onClick={onStop}
                disabled={!isBusy}
              >
                Stop
              </button>
              <button
                type="button"
                className="rounded-full bg-[#1f6b4a] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                onClick={() => {
                  if (error) onClearError();
                  onReview();
                }}
                disabled={isBusy || !input.trim()}
              >
                Send review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
