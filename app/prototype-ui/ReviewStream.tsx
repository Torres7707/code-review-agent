"use client";

import { Streamdown } from "streamdown";
import type { MyUIMessage } from "@/lib/types";

/** Minimal shared stream renderer — layout stays per-variant. PROTOTYPE. */
export function ReviewStream({
  messages,
  className = "",
}: {
  messages: MyUIMessage[];
  className?: string;
}) {
  const assistants = messages.filter((m) => m.role === "assistant");
  if (assistants.length === 0) return null;

  return (
    <div className={className}>
      {assistants.map((message) => (
        <article key={message.id} className="space-y-2">
          {(message.metadata?.createdAt || message.metadata?.totalTokens) && (
            <p className="font-mono text-[11px] uppercase tracking-wider opacity-50">
              {message.metadata?.createdAt
                ? new Date(message.metadata.createdAt).toLocaleTimeString()
                : null}
              {message.metadata?.totalTokens
                ? ` · ${message.metadata.totalTokens} tokens`
                : null}
            </p>
          )}
          {message.parts.map((part, index) =>
            part.type === "text" ? (
              <Streamdown
                key={`${message.id}-${index}`}
                isAnimating={part.state === "streaming"}
              >
                {part.text}
              </Streamdown>
            ) : null,
          )}
        </article>
      ))}
    </div>
  );
}
