# React Code Review Agent（starter）

一个最简单的 **React 代码审查 Agent**：粘贴 React 代码 → 点 Review → AI 的审查结果流式显示在下方。

> 这是 **脚手架（starter）**，核心逻辑留空（`TODO(you)`），由你自己从空白写起、调试、讲清楚。
> 对应 90 天计划的 **Week 2**：https://plan-tracker-eta.vercel.app/weeks/2

技术栈：Next.js（App Router, TS strict）· AI SDK v7（`ai@7` + `@ai-sdk/react@4`）· Vercel AI Gateway · Tailwind

## 你自己要做的 4 步

| # | 做什么 | 文件 |
|---|--------|------|
| 1 | 写/改系统提示词（只报真实问题、按严重度排序、每条给原因+修复、没问题就说 "No problems found"） | `lib/prompt.ts` |
| 2 | 实现流式 API：读 body → `streamText({ model, instructions, messages: await convertToModelMessages(messages), abortSignal: req.signal })` → `result.toUIMessageStreamResponse()` | `app/api/review/route.ts` |
| 3 | 页面接上 `useChat`（`@ai-sdk/react`）+ `DefaultChatTransport({ api: "/api/review" })`，点 Review 调 `sendMessage({ text })` | `app/page.tsx` |
| 4 | 渲染 `messages` 的 `parts`（`type === "text"`），自测 + 能讲清楚数据怎么流 | `app/page.tsx` |

暂时不做：Stop 按钮、错误处理、结构化输出、tools（Week 2–4 再加）。

## 运行

```bash
nvm use            # Node 24（.nvmrc）
npm i
cp .env.example .env.local   # 填 AI_GATEWAY_API_KEY
npm run dev        # http://localhost:3000
```

## 做完你应该看到

- 粘贴一段有 bug 的组件（例如 `useEffect` 缺依赖、列表没 `key`）→ 点 Review → 结果**一个字一个字地**流出来，按 🔴/🟡/🟢 排序，每条有 Why + Fix。
- 粘贴干净的代码 → 只回 "No problems found ✅"。
- 现在（未实现前）`POST /api/review` 返回 `501 {"error":"not implemented yet"}`。

## 常见坑

- **Node 20 会悄悄装成 ai v6**（v7 需要 Node ≥ 22）。先 `nvm use`，装完用 `npm ls ai @ai-sdk/react` 确认是 7.x / 4.x。
- v7 里 `system` 改名为 **`instructions`**；`stepCountIs` → `isStepCount`；`convertToModelMessages` 要 `await`。
- API key **只在服务端**用，不要加 `NEXT_PUBLIC_` 前缀。
- **永远不要提交 `.env.local`**（`.gitignore` 已排除 `.env*`，只保留 `.env.example`）。

## 链接

- AI SDK 7 迁移指南：https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0
- Chatbot（useChat）文档：https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- Vercel Academy · AI SDK：https://vercel.com/academy/ai-sdk
- Vercel AI Gateway：https://vercel.com/docs/ai-gateway
