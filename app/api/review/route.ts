// POST /api/review —— 这是你要自己写的核心（Step 2）。
// 现在只返回 501，保证 lint / build 能通过、页面能打开。

// 流式响应最长允许 30 秒（Vercel Functions）。
export const maxDuration = 30;

export async function POST(req: Request) {
  // TODO(you) Step 2 —— 按顺序实现（ai v7 API，名字已对照 node_modules/ai 的类型确认）：
  //
  // 1. import { streamText, convertToModelMessages, type UIMessage } from "ai";
  //    import { REVIEW_PROMPT } from "@/lib/prompt";
  //
  // 2. 读请求体（useChat 默认发送 { messages: UIMessage[] }）：
  //    const { messages }: { messages: UIMessage[] } = await req.json();
  //
  // 3. 调用 streamText：
  //    const result = streamText({
  //      model: process.env.AI_MODEL ?? "openai/gpt-5-mini", // AI Gateway 的 "provider/model" 字符串
  //      instructions: REVIEW_PROMPT,                         // v7：instructions（system 已废弃）
  //      messages: await convertToModelMessages(messages),    // v7 里它是 async，要 await
  //      abortSignal: req.signal,                             // 用户关页面/中断时停止生成
  //    });
  //
  // 4. 返回 UI message stream：
  //    return result.toUIMessageStreamResponse();
  //
  // 写完后删掉下面这段 501。
  void req;
  return Response.json({ error: "not implemented yet" }, { status: 501 });
}
