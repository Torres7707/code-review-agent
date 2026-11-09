# Review Surface — Direction Contract

## THESIS
Every code review session is a split-panel workspace — repo rail, diff, Issue Cards — and the memory-making move is bidirectional line↔card highlighting: click a PR line, the matching Issue Card lights up; click an Issue Card, the matching line of the diff blinks its severity color. Role is operator (developer); mode is Operate; the world is the canon category-standard for code-review tooling (dark split-panel: Vercel Dashboard rhythm + GitHub diff rendering + Linear's single-accent discipline).

## OWN-WORLD
Full canon palette: no grays in the shell — deep navy/zinc surfaces (#0d1117 base, #161b22 panel, #1c2128 input, #21262d raised), with one indigo accent (#58A6FF / #1F6FEB) carrying the primary action and active-state rail. Semantic severity: red #FF6363 (high), amber #D29922 (medium), green #3FB950 (low), each reserved exclusively for issue grade. Typography: Inter/system sans for UI, ui-monospace for diff and card code. Component language: dark top navbar with repo breadcrumb (Linear-style), left rail (240px) with ável sections, center diff with per-file expand, right third Issue Card transcript. Controls: 6px radius, 1px borders in #30363D, no shadows.

## STORY
The user picks up this app wanting to review a PR. They land at `/` and see a calm split-panel — repo rail on the left, diff center, Issue Cards right. They pick a repo by clicking its rail row; the rail's active indicator is an indigo left bar. Then they pick a PR; the diff loads center. As the AI "streams" Issue Cards into the right panel (animated), each card carries a severity-colored gradient banner, a line location, a "why"/"fix" pair, and a "View in diff" affordance. Click a card → the diff scrolls to its line and the line glows in the severity color. Click a diff line → the matching issue card pulses. The interaction is the signature.

## FIRST VIEWPORT
Top navbar (48px): brand-left ("Code Review Agent" — small caps + a dot); right shows mock-GitHub avatar + "Sign out". Below: left rail 240px — "REPOS" section with 5 Vercel repos (vercel/next.js, vercel/ai, vercel/v0, etc.), "PRs" section listing 5 open PRs with status icons and time stamps. Center: PR header row ("#4821 · Fix auth race condition", branch, file count, +/- lines). Below count: file-diff section with expand-all, single file "src/app/page.tsx" expanded with hunk header `@@ -20,7 +22,9 @@` and 6 lines of JSX + a highlighted anchor line. Right panel (380px): AI Review header + 3 Issue Cards stacked, severity strip on left edge, icon + title + "Why" paragraph + collapsible "View fix". Each card has a small breadcrumb of location (line 23).

## FORM
Assigned-canvas-canon (index 5 in category time list; canon card from the roll). Seed reference: not printed this session. Assigned run reach built on the 52f84336dbaa256e92dd2ea0cbf13351 roll — canon chosen by user.

## FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
