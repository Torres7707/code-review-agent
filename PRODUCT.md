# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary user: the author plus anyone who sees the demo.** This is a personal portfolio project, not a SaaS. The main stress-test audience is "someone evaluating the work": recruiters, colleagues, friends watching a demo, or a future maintainer browsing the repo.
- **Scene:** the author runs a local dev server to self-review React/TS code before merging a PR; later it's deployed to Vercel so a URL can be shared. The primary success is that a visitor to the deployed URL can walk through the GitHub-OAuth → repo → PR → Issue Cards flow in under a minute.
- **Job being done:** make a React/TS PR less scary—catch real bugs (stale closures, bad hook usage, missing deps, security) surface as structured, actedable cards, not a wall of markdown.

## Product Purpose

A single-user GitHub-integrated React code reviewer. Paste a URL, pick a PR, AI streams back structured Issue Cards with severity, "why", and suggested "fix" per issue.

Success = a developer can trim minutes off a code review cycle: run this on a PR before merging, skim 3-5 Issue Cards, ship.

## Positioning

Not a second pair of eyes on a chat interface (GitHub Copilot Code Review, Graphite, etc. do that). This one:
- Stays in the *local* flow: local dev server, localhost GitHub OAuth callback, No DB. The deployable artifact is the personal workspace tool.
- Reacts to React and TypeScript first; the demo currently targets a small React UI (VariantB Split IDE + Issue Cards) and its purpose is to *show the workflow, not to replace Copilot*.

## Operating Context

- Workflows: author opens PR → clicks "Run review" → watches AI stream Issue Cards → filters by severity → fixes the High ones → reruns.
- Environments: local (localhost:3000 via `next dev`) for daily use; Vercel deployment for sharing. Node 24 per `.nvmrc`.
- Tools around it: GitHub (repos, PRs), Vercel AI Gateway, Vercel platform, Tailwind v4, `@tailwindcss/typography`, `streamdown` for message markdown rendering.
- Documentation: `REVIEW.html` (single-page design doc, v2.0, 12 sections covering complete OAuth flow + Issue Cards mockup). `README.md` is the original starter scaffold.

## Capabilities and Constraints

**Capables:**
- Analyze React / TypeScript / JSX source (prompt targets React code review).
- Three UI prototype variants (A/B/C) currently switchable via `?variant=A|B|C`; VariantB (Split IDE) is recommended for the final design.
- Fixed system Prompt (`lib/prompt.ts`): sort real problems high/medium/low, only report real issues, "No problems found ✅" when clean, reply in the user's language.
- Single-user GitHub OAuth login (device flow or callback); token in encrypted cookie (`jose`); no DB.
- Fetch user's repos → list their open PRs → pull PR diff → stream review → render structured Issue Cards (each card: severity badge, code snippet, Why, collapsible Fix).
- Keep "paste raw code" as a fallthrough entry (FR-8 in design doc).
- Touch history stored in browser `localStorage` (limited 50 records, LRU).

**Constraints:**
- Node ≥ 22 (`package.json#engines`); Vercel AI Gateway = needs `AI_GATEWAY_API_KEY`.
- Initial stage: single user, no multi-user system, no DB, no audit trail.
- No Bot comments back to PR, no Webhook-triggered auto-review (those require GitHub App, out of scope for this phase).
- Reviewing large PRs hits GitHub API's 3000-line / 100-files truncation; UI shows a note.
- The `PrototypeSwitcher` component is prototype-only and should be removed for production, or gated behind `NODE_ENV === 'development'`.

## Accessibility & Inclusion

- Target: WCAG AA for keyboard operability, contrast, focus states where shipped.
- No confirmed product-specific accessibility need beyond defaults yet.
