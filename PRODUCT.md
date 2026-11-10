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
- Reacts to React and TypeScript first; the shipped UI is the three-panel console (repo rail, diff, Issue Cards) and its purpose is to *show the workflow, not to replace Copilot*.

## Operating Context

- Workflows: author picks a PR → the review starts automatically (or comes from cache) → watches AI stream Issue Cards → filters by severity → fixes the High ones → pushes → re-runs.
- Environments: local (localhost:3000 via `next dev`) for daily use; Vercel deployment for sharing. Node 24 per `.nvmrc`.
- Tools around it: GitHub (repos, PRs), Vercel AI Gateway, Vercel platform, Tailwind v4.
- Documentation: `README.md` (setup, architecture, review contract), `DESIGN.md` (design system), `DESIGN-REVIEW.html` (design review).

## Capabilities and Constraints

**Implemented:**
- Single-user GitHub OAuth login (callback flow); access token in an AES-GCM encrypted, HttpOnly cookie; token revoked at sign-out; no DB.
- Fetch user's repos (with a filter box) → list their open PRs → pull PR diff → stream review → render structured Issue Cards (severity badge, file and line, Why, collapsible Fix with copy).
- Fixed system prompt (`lib/prompt.ts`): React/TS focus, real problems only, ordered high → low, PR content treated as untrusted data.
- Line-numbered diff in the prompt plus a `quote` per issue, so cards anchor to the right line; approximate anchors are labelled.
- Explicit review states (not reviewed, reviewing, finished, cached, stopped, failed) with Stop, Retry, and Re-run.
- Severity filter, review summary, and a per-file note on what was not reviewed (truncated, over the file limit, no diff).
- Reviews cached per head commit in memory + `sessionStorage` (40 entries).

**Planned (not built yet):**
- "Paste raw code" entry (FR-8 in the design doc). Removed from the API for now so the endpoint only reviews PRs the signed-in user can read.
- Review history in `localStorage` (50 records, LRU).
- Reply in the user's language.
- Demo mode with a sample PR that works without signing in.
- GitHub App (read-only permissions) instead of an OAuth App.

**Constraints:**
- Node ≥ 22 (`package.json#engines`); Vercel AI Gateway = needs `AI_GATEWAY_API_KEY`.
- Initial stage: single user, no multi-user system, no DB, no audit trail.
- No Bot comments back to PR, no Webhook-triggered auto-review (those require GitHub App, out of scope for this phase).
- GitHub serves at most 3000 files per PR and omits patches for binary or very large files; the review sends at most 12 files and 8k characters per patch. The UI shows a note for anything not reviewed.

## Accessibility & Inclusion

- Target: WCAG AA for keyboard operability, contrast, focus states where shipped.
- No confirmed product-specific accessibility need beyond defaults yet.
