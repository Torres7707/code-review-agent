# Code Review Agent

A single-user, local-first PR reviewer. Sign in with GitHub, pick one of your repos,
pick an open pull request, and the agent streams back **Issue Cards** — severity-graded
(High / Medium / Low) findings with the line they sit on, why it's a problem, and a suggested
fix.

The point is not to replace Copilot code review. It's a personal workspace tool: it runs
from `next dev` on your machine, talks to GitHub with *your* token, stores nothing, and lets
you skim a diff before merging instead of reading a wall of markdown.

---

## What it looks like

A three-panel console on a dark GitHub-ish surface:

```
┌───────────────────────────────────────────────────────────────┐
│  ● Code Review Agent · pr-review            torreswang  [Sign out] │
├────────────────────┬──────────────────────────┬───────────────┤
│  REPOS             │  #4821 Fix auth race     │  AI Review    │
│  › next.js    TS   │  fix/auth-race  +1204 -890│  High 2       │
│    + 4 open PRs    │  @@ -20,7 +22,9 @@        │  Med 1        │
│  › ai         TS   │   22  const [a, setA] = … │  Low 3        │
│  › swr        TS   │──────────────────────────│  ──────────   │
│  › turbo      RS   │  … diff …                │  ▍ High       │
│                    │                          │  Stale closure…│
│                    │                          │  View fix ▾   │
└────────────────────┴──────────────────────────┴───────────────┘
```

The signature interaction is **bidirectional line ↔ card highlighting**: click a line in
the diff and its Issue Card pulses; click a card and the diff scrolls to the line, which
flashes in the severity color.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) |
| UI | React 19.3 + Tailwind v4 |
| Model | `ai@7` AI SDK + `@ai-sdk/react@4`, Vercel AI Gateway |
| Auth | GitHub OAuth App (stateless, HMAC-signed cookie) |
| Tests | Vitest 5 |
| Runtime | Node 24 (`.nvmrc`), pnpm |

No database. No session store. No code is persisted anywhere.

---

## Setup

```bash
fnm use            # Node 24 per .nvmrc
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`:

```dotenv
# --- model -----------------------------------------------------------------
AI_GATEWAY_API_KEY=     # https://vercel.com/docs/ai-gateway
AI_MODEL=openai/gpt-5-mini

# --- GitHub OAuth App ------------------------------------------------------
# https://github.com/settings/developers → New OAuth App
#   Homepage URL:               http://localhost:3000
#   Authorization callback URL: http://localhost:3000/api/auth/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional: separate HMAC key for the session cookie (falls back to the client secret)
SESSION_SECRET=
```

Then:

```bash
pnpm dev           # http://localhost:3000
```

---

## The app in 60 seconds

1. **Sign in** → redirects to GitHub's authorize page (`repo`, `read:user`), back to
   `/api/auth/callback`. The access token is stored **only** in an `HttpOnly` cookie, signed
   with HMAC-SHA256; the `state` parameter is checked against a short-lived cookie.
2. **Pick a repo** → the left rail lists your most recently pushed repositories.
3. **Pick a PR** → open PRs on that repo, with author and timestamps, load into the rail.
4. **The diff loads** → GitHub's per-file `patch` is parsed into numbered add / del / context
   lines in the centre panel.
5. **The review streams** → `POST /api/review` fetches the PR files server-side with your
   token, hands the hunks to the model with a structured-output schema, and the Issue
   Cards appear as the JSON streams in — no wait for the full response.
6. **Issues re-anchor** → each issue's reported line is mapped onto lines actually rendered
   in the diff; lines elided by the diff viewer snap to the nearest visible line in the
   same file, and issues pointing at a file that isn't in the PR lose their anchor rather
   than lighting up the wrong line.

---

## Architecture

```
app/
  api/
    auth/github/route.ts      GET  → redirect to GitHub authorize (+ state cookie)
    auth/callback/route.ts    GET  ← code; verify state, exchange for token,
                                   set signed session cookie, redirect to /
    auth/signout/route.ts     POST → clear session cookie
    me/route.ts               GET  → { user } or { user: null }
    repos/route.ts            GET  → the user's repos                 (401 unauth)
    repos/[owner]/[repo]/prs/route.ts         GET  → open PRs         (401 unauth)
    repos/[owner]/[repo]/prs/[number]/route.ts GET  → one PR's totals  (401 unauth)
    repos/[owner]/[repo]/prs/[number]/diff/route.ts GET → parsed diff (401  unauth)
    review/route.ts           POST → streamed structured review
  components/
    CodeReviewApp.tsx         client orchestrator: session → repos → PRs → diff → review
    Header.tsx  RepoRail.tsx  DiffView.tsx  IssueCards.tsx  AuthGate.tsx
lib/
  github-auth.ts              signed session cookie, state cookie, redirect URI
  github.ts                   typed GitHub REST helper
  diff.ts                     unified-patch → DiffView line records
  review-schema.ts            zod schema shared by route and client (useObject)
  review-prompt.ts            model turn builder (PR header, file hunks, pasted code)
  review-core.ts              pure: line anchoring, prompt building, review → Issue[]
  use-review.ts               useObject stream → Issue[] with anchor correction
  types.ts                    shared domain types
tests/                        Vitest: diff parser, session signing, review core, route
```

### The review contract

`lib/review-schema.ts` is the single source of truth:

```ts
{ summary: string,
  issues: [{ severity: "high" | "medium" | "low",
             title, file: string, startLine: number, endLine?: number,
             why, fix }] }
```

It is passed to `streamText({ output: Output.object({ schema }) })` on the server and to
`useObject({ schema })` on the client, so the streamed partial JSON is validated on both
ends. The system prompt (`lib/prompt.ts`) is written to match this schema — it never asks
the model for markdown prose, because parsed-object output has no prose channel.

---

## Deploying to Vercel

Nothing in the OAuth code assumes localhost: the callback URL is derived from the
request's own host.

1. Import the repo into Vercel.
2. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `AI_GATEWAY_API_KEY`
   (and optionally `AI_MODEL`) as project environment variables.
3. In the **same** GitHub OAuth App you use locally, add a second
   **Authorization callback URL**:
   `https://<your-app>.vercel.app/api/auth/callback`

   GitHub accepts multiple callback URLs per OAuth App, so local dev keeps working
   unchanged.
4. Deploy. The session cookie is marked `Secure` automatically when
   `NODE_ENV=production`.

---

## Scripts

```bash
pnpm dev            # next dev on :3000
pnpm build          # production build
pnpm start          # serve the build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run
pnpm test:watch     # vitest in watch mode
```

## Notes and limits

- GitHub's `files` API omits a `patch` for binary files and for diffs above its size
  limit; those files are skipped in the diff view rather than shown truncated.
- Large PRs are capped at 12 files and 8k characters of patch per file before going to
  the model (`lib/review-core.ts`), purely to bound request cost.
- The review is anchored line-by-line, not to postable GitHub review comments yet —
  everything stays local to the UI.
- `app/prototype-ui/` holds earlier layout variants and is not part of the shipped app.
