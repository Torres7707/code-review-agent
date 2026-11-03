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
import { useEffect, useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/review" }),
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold">React Code Review Agent</h1>
      <textarea
        className="h-64 w-full rounded border p-3 font-mono text-sm"
        placeholder="把你的 React 代码粘贴到这里…"
        // TODO(you): value / onChange
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="button"
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        // TODO(you): onClick → sendMessage；status 不是 "ready" 时 disabled
        onClick={() => sendMessage({ text: input })}
        disabled={status !== "ready"}
      >
        Review
      </button>
      <button
        type="button"
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={() => stop()}
        disabled={status !== "streaming"}
      >
        Stop
      </button>
      {error ? (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </p>
      ) : null}
      <section className="min-h-32 whitespace-pre-wrap rounded border p-3 text-sm">
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "assistant" ? (
              <div>
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("")}
              </div>
            ) : (
              ""
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
