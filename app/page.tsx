// 静态 UI 外壳 —— Step 3 由你接上 useChat。
// TODO(you): wire up useChat/streaming
//   1. 文件顶部加 "use client";
//   2. import { useChat } from "@ai-sdk/react";
//      import { DefaultChatTransport } from "ai";
//   3. const { messages, sendMessage, status } = useChat({
//        transport: new DefaultChatTransport({ api: "/api/review" }),
//      });
//   4. 用 useState 管 textarea；点 Review 时 sendMessage({ text: code })
//   5. 在结果区遍历 messages → message.parts，渲染 part.type === "text" 的 part.text

"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Streamdown } from "streamdown";
import type { MyUIMessage } from "@/lib/types";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error, clearError } =
    useChat<MyUIMessage>({
      transport: new DefaultChatTransport({ api: "/api/review" }),
    });

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">React Code Review Agent</h1>
      <textarea
        className="h-64 w-full rounded border p-3 font-mono text-sm"
        placeholder="把你的 React 代码粘贴到这里…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="button"
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={() => {
          if (error) clearError();
          sendMessage({ text: input },{
            body:{
              customKey:'customValue'
            }
          });
        }}
        disabled={isBusy}
      >
        Review
      </button>
      <button
        type="button"
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={() => stop()}
        disabled={!isBusy}
      >
        Stop
      </button>
      {error ? (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </p>
      ) : null}
      <section className="prose prose-sm min-h-32 max-w-none rounded border p-3 dark:prose-invert">
        {messages.map((message) =>
          message.role === "assistant" ? (
            <div key={message.id}>
              {message.metadata?.createdAt &&
        new Date(message.metadata.createdAt).toLocaleTimeString()}
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
               {message.metadata?.totalTokens && (
        <span>{message.metadata.totalTokens} tokens</span>
      )}
            </div>
          ) : null,
        )}
      </section>
    </main>
  );
}
