---
name: Code Review Agent
description: Dark split-panel review console — deep navy/zinc surfaces, one indigo accent, severity-grade Issue Cards, bidirectional line↔card highlighting
colors:
  bg-base: "#0d1117"
  bg-panel: "#161b22"
  bg-raised: "#1c2128"
  bg-hover: "#21262d"
  border-default: "#30363d"
  text-primary: "#e6edf3"
  text-secondary: "#8b949e"
  text-muted: "#848d97"
  accent: "#58a6ff"
  accent-hover: "#79b8ff"
  accent-deep: "#1f6feb"
  sev-high: "#ff6363"
  sev-medium: "#d29922"
  sev-low: "#3fb950"
  diff-add-bg: "#1e3a29"
  diff-add-fg: "#7ee787"
  diff-del-bg: "#490192"
  diff-del-fg: "#ffa198"
  button-bg: "#24292f"
  button-bg-hover: "#2f363d"
  scrollbar-hover: "#484f58"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: '"cv11", "ss01"'
  body-small:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Ubuntu Mono', monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.button-bg}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.button-bg-hover}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    typography: "{typography.body-small}"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "11px Inter 400 (mono fix code beside it)"
  card-issue:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px"
  card-issue-active:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px"
  diff-line-add:
    backgroundColor: "{colors.diff-add-bg}"
    textColor: "{colors.diff-add-fg}"
    height: "20px"
    typography: "{typography.mono}"
  diff-line-del:
    backgroundColor: "{colors.diff-del-bg}"
    textColor: "{colors.diff-del-fg}"
    height: "20px"
    typography: "{typography.mono}"
  diff-line-context:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    height: "20px"
    typography: "{typography.mono}"
  repo-row:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    padding: "8px 12px"
    width: "240px"
  pr-row:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    padding: "8px 12px"
    width: "240px"
  header-bar:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    height: "48px"
    width: "100%"
  auth-screen:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-secondary}"
    height: "calc(100vh - 3rem)"
    padding: "32px"
  stats-bar:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.text-muted}"
    padding: "8px 16px"
---

# Design System: Code Review Agent

## Overview

**Creative North Star: "The Review Console"**

The Code Review Agent is a dark, split-panel review console: a repo rail on the left, the PR diff in the center, and AI Issue Cards streaming in from the right. It reads like the category-standard GitHub dark IDE, not a chat app or a SaaS dashboard — an operator's instrument for pre-merge review, where the workspace is the point and the conversation is the output. Density is IDE-grade (11px labels, 12px body, 13px titles), calm and precise, with zero decorative motion beyond the authored streaming animation.

Aesthetic philosophy: one continuous dark surface. The shell is a four-step navy/zinc tonal ladder — #0d1117 base under #161b22 panels under #1c2128 raised,hovering at #21262d — and there are no grays in the shell, no gradients, and no shadows anywhere, at rest. Hierarchy is carried by tone, borders, and one precise indigo accent (#58a6ff) that does the only "loud" thing in the room: it picks the active rail row, the PR number, focus rings, and the "View fix" link. Severity lives in exactly three colors — #ff6363 (high), #d29922 (medium), #3fb950 (low) — used nowhere except issue grade.

The signature is the bidirectional line↔card link: click a diff line and its Issue Card pulses in the severity color; click a card and its diff line flashes. The signature is the product — the workspace exists to make that connection feel like magic.

**Key Characteristics:**
- Deep navy/zinc shell: #0d1117 base, #161b22 panels, #1c2128 raised, #21262d hover — zero grays, zero drop shadows
- One indigo accent (#58a6ff) for selection, active state, focus, and interaction
- Three severity colors (#ff6363 / #d29922 / #3fb950) reserved exclusively for issue grade
- 6px corners, 1px #30363d borders, no elevation lift anywhere
- Compact IDE density: 11px labels, 12px body, 13px titles
- Tabular numerals on every data number
- Signature: bidirectional line↔card severity flashing, animated AI streaming

## Colors

The palette is the canon GitHub dark shell plus exactly three severity grades. It reads as a single dark surface with one blue voice — no second accent, no light theme, no SaaS pastels.

### Primary
- **Signal Blue** (#58a6ff): the one accent. Marks the active rail row (15% tinted background), the rail's active left bar, the PR number in the center header, the global focus ring, the caret, text selection, and the "View fix" link on Issue Cards. Hover state: #79b8ff.
- **Deep Indigo** (#1f6feb): the saturated selection backdrop (`::selection`, white text). The accent's darker sibling, used only as a text-selection wash.

### Neutral
- **Deep Space Black** (#0d1117): the canvas — body, diff area, empty state, code blocks inside Issue Cards.
- **Panel Navy** (#161b22): every chrome surface — repo rail, Issue Cards panel, PR header, file-diff header, Issue Card surfaces.
- **Raised Slate** (#1c2128): all hover states (rows, cards) and the declared input ground.
- **Hover Slate** (#21262d): the top of the tonal ladder — the declared raised-hover step.
- **Graphite Line** (#30363d): every 1px structural border, divider, the scrollbar thumb. Scrollbar thumb hover: #484f58.
- **Frost White** (#e6edf3): primary text everywhere.
- **Muted Slate** (#8b949e): secondary text — PR rows, body copy, chrome labels.
- **Haze Gray** (#848d97): hint text, timestamps, section eyebrows, ghost line numbers. Raised from #6e7681 so 11px labels reach 4.5:1 on the panel and raised surfaces (WCAG AA).
- **Button Charcoal** (#24292f / hover **#2f363d**): the GitHub-gray primary action surface (the AuthGate sign-in button).

### Severity (issue grade only)
- **Alert Red** (#ff6363): high — severity badge, card rail, stats number, diff line flash.
- **Amber Yellow** (#d29922): medium — same roles.
- **Mint Green** (#3fb950): low — same roles, plus the sanctioned "Finished" status pill in the PR header, which borrows the low green as a clean-signal.

### Diff
- **Add Green Wash** (#1e3a29) with **Bright Green** (#7ee787) text: added lines.
- **Delete Purple Wash** (#490192) with **Salmon Pink** (#ffa198) text: deleted lines. The diff component reads it from `--diff-del-bg`.

### Named Rules
**The One Accent Rule.** One indigo, and only one: #58a6ff picks the active row, the PR number, the focus ring, and the View-fix link. Nothing else in the system is blue, and no second accent may be introduced.

**The Severity-Only Rule.** Red, amber, and green exist to grade issues. They may not appear as decoration, branding, success states, or hover responses. The single sanctioned exception is the "Finished" pill, which borrows the low green as a clean-signal.

**The Layering Rule.** Surfaces stack in exactly four tonal steps — #0d1117 base, #161b22 panel, #1c2128 raised, #21262d hover — never through shadows or through off-palette grays.

## Typography

**Display Font:** Inter with the system sans fallback (ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto). Inter is declared in the stylesheet but not self-hosted, so the shipped build renders the system sans (SF Pro Text on macOS); the stack is written so that path is the intended one.
**Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Ubuntu Mono" — used for all code, every number that is data, PR numbers, file paths, hunk headers, and location tags.

**Character:** Two voices only — a human sans for all readable language, a machine mono for everything that is data or code. Type never sets a mood; it sets a hierarchy from whisper (11px muted mono) to statement (the 22px login wordmark), with tracking-tight on the product wordmark and uppercase 11px eyebrows introducing section labels.

### Hierarchy
- **Display** (600, 22px, 1.25, tracking-tight −0.01em): the hero headline — the "Code Review Agent" wordmark on the login screen. The largest text in the system.
- **Headline** (600, 16px, 1.2): the StatsBar counters — the numbers the operator scans first, always tabular.
- **Title** (500, 13px, 1.4): Issue Card titles, PR titles, the header wordmark, file paths (in mono).
- **Body** (400, 13px, 1.625, font-feature "cv11", "ss01"): sign-in button text and the login paragraph (capped at a 440px measure ≈ 50–60ch).
- **Body-small** (400, 12px, 1.55): Issue Card "why" copy, clamped to three lines.
- **Label** (600, 11px, uppercase, 0.08em tracking): section eyebrows — "Repos", "AI Review" (which runs 0.12em). Severity badges drop to 10px semibold at 0.08em. Line numbers, timestamps, and metadata run 11px mono muted.
- **Mono** (400, 11–13px, 1.7): diff code at 12px in 20px-tall line boxes; PR numbers at 12–13px; file paths 13px; hunk headers and line tags 11px.

### Named Rules
**The Two-Voices Rule.** Sans carries human words; ui-monospace carries every machine token — PR numbers, line numbers, file paths, hunk markers, and code. Machine tokens are never set in sans.

**The Tabular Numbers Rule.** Every number that is data — stars, counts, +/− deltas, line numbers, stat totals — renders in tabular numerals (the `tabnum` class). Proportional figures that jitter between digits are a defect; the mono gutters and stat counters would visibly lie without this.

## Layout

The app is a full-viewport column: a fixed 48px Header on top, and below it a single workspace row — repo rail (240px), main column (flex-1), Issue Cards panel (380px). The main column carries the PR header row (when a PR is selected) above the DiffView. The window never scrolls; the rail list, the diff, and the card list each scroll internally with thin 8px canon scrollbars (#30363d thumb, transparent track).

Density and rhythm are IDE-grade. Vertical spacing follows the row scale: 8px vertical padding on list rows and card-list items (`py-2`), 12px on card surfaces and the PR header (`p-3` / `py-2.5`), 16px on panel chrome (`px-4`) and the rail's section eyebrow (`pt-4 pb-2`). Horizontal rhythm: 12px inside rows, lists, and diff code (`px-3`), 16px inside panels (`px-4`), and an 8px inner indent (`pl-2`) behind every Issue Card severity rail. Micro gaps run at 4px between adjacent tiny elements; standard gaps at 8px (row content) and 16px between stats.

Width tokens are fixed: rail 240px, Issue Cards panel 380px, header 48px, avatar 24px, rail active bar 4px wide × 16px tall. The center column claims the remaining space and never shrinks below its content ("min-w-0" compression) — diffs scroll rather than squeeze the shell.

Responsive tiers (as shipped):
- **≥901px:** three-panel row — rail (240px) + main (flex-1) + Issue Cards (380px), each with its own internal scroll.
- **≤900px:** the workspace collapses to a column — diff first with a 50vh minimum, Issue Cards full-width below it under a 1px top border instead of the side border.
- **≤600px:** the rail disappears entirely and the main column takes 100% width — a prototype trade-off (repo selection is unreachable at phone widths).

## Elevation & Depth

Flat by design. The system uses zero drop shadows at rest — depth comes from the four-step tonal ladder, 1px graphite borders, and the difference between scrollable and chrome surfaces. The one shadow-bearing element in the whole system is the transient severity pulse (a 600ms `box-shadow: 0 0 0 3px <severity>` that answers the line↔card interaction), and it expires as soon as it is seen.

### Shadow Vocabulary
- **Severity Pulse** (`box-shadow: 0 0 0 3px var(--flash-bg)`, 600ms, one-shot): the active Issue Card's moment of attention. `--flash-bg` carries the severity color; the shadow never persists.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth = tone + border, period. A persistent shadow is a defect, and a shadow that means "this card is more important" is never acceptable — importance is carried by rings, flashes, and badges.

## Shapes

The form language is tool-neutral: 6px corners on everything interactive and containery — buttons, Issue Cards, status pills — and fully round on the atomic shapes that read as a single glyph: rail indicator dots, status dots, idend avatars, rail bars, and badges. 8px appears once, on the empty-state panel. List rows, diff lines, and the StatsBar wear no radius — they are rows inside their surfaces.

Borders: every edge you can trace between two surfaces is a solid 1px #30363d line — top bar, rail right, panel dividers, card outlines, indent lines under nested PR rows. The only exceptions are the empty state (a 2px dashed #30363d box) and the hairline between file-diff blocks (`border-black/40`), which is quieter than the structural border on purpose. Diff line flashes use an inset 2px ring in the severity color rather than a border color change.

### Named Rules
**The 6px Rule.** 6px is the one corner for controls and cards. Rounded (full) is reserved for badges, dots, pills, avatars, and rail bars — shapes that read as a single glyph. Nothing else rounds.

**The 1px Border Rule.** Every structural edge is 1px #30363d, solid. Border color never carries meaning: status and severity announce themselves via rings, flashes, and badges, never a repainted border.

## Components

### Button (Primary)
- **Shape:** 6px corners (rounded-md); no border, no shadow.
- **Surface:** GitHub-gray #24292f fill, white text, 13px, padding 8px 16px, inline-flex with a 16px GitHub mark and an 8px gap. Appears once — the AuthGate "Sign in with GitHub".
- **Hover:** #2f363d. **Focus:** 2px indigo ring offset 2px.

### Button (Secondary)
- **Shape:** 6px corners, 1px #30363d border, transparent fill.
- **Surface:** muted-slate text, 12px, padding 4px 12px. Appears once — "Sign out" in the header.
- **Hover:** fill raises to #1c2128 with Frost White text. **Focus:** 2px indigo ring.

### Button (Link)
- **Shape:** none — a text action, no padding, no border, no fill.
- **Surface:** 11px, accent text; the "View fix" affordance inside Issue Cards. Expanded state switches to Haze Gray ("Hide fix").
- **Hover:** accent lightens to #79b8ff. Expands a 4px-rounded, 11px mono fix code block on a #0d1117 surface beside it.

### Card (IssueCard)
- **Shape:** 6px corners, 1px #30363d border, panel-navy fill, 12px padding.
- **Severity rail:** a 3px solid severity bar down the left edge, fully round, inset 12px from top and bottom — the card's grade read at a glance. A 10px semibold uppercase badge at 0.08em repetition in a 10% severity tint repeats it up top, beside a mono "line 23" location tag.
- **Content rhythm:** badge + line tag → 13px medium title → 12px "why" (clamped to three lines, muted-slate) → a hairline footer with the View-fix link expanding the fix snippet.
- **States:** Hover raises to #1c2128. Active carries a 1px indigo ring plus a 600ms severity pulse (box-shadow 0 0 0 3px) — the card border itself is never repainted. Streaming cards assemble with a 240ms fade + 8px rise, staggered 650ms per card.

### DiffLine
- **Shape:** no corners — a flat 20px row. Add lines: #1e3a29 wash, #7ee787 text. Deleted lines: #490192 wash, #ffa198 text. Context lines: on the base canvas, secondary text.
- **Data columns:** two right-aligned 40px mono gutters (old/new line numbers, 11px, 50% opacity) before the code, which is 12px mono on `whitespace-pre` with 12px horizontal padding.
- **Interactive:** lines carrying an issue are roles (keyboard: Enter, Tab, aria-label "Jump to issue…"), hover washes 5% white; the active line flashes its severity (900ms background flash, 2px inset severity ring, plus a small 10px uppercase severity pill at the row's right edge).

### RepoRow / PRRow
- **Shape:** no radius — full-width list buttons, 12px horizontal / 8px vertical padding, 8px gap between the indicator bar and content.
- **Active state:** a 15% accent tint fill, primary text, and the signature indigo left bar — a 4px × 16px rounded bar inset 3px from the row's top.
- **Inactive:** muted-slate text; hover fills #1c2128 with primary text.
- **RepoRow:** 12px medium name (truncates) over an 11px muted "TS · ★ 124,800" meta line.
- **PRRow:** mono "#4821" beside a truncated 12px title; a muted 11px meta row — author · 4h ago · +1,204 −890 (green/red, tabular, right-aligned). PRs nest under their repo under a 1px graphite indent, 16px in from the rail edge.

### Header
- **Shape:** full-width 48px bar, 1px #30363d bottom border, canvas fill.
- **Left:** the 8px accent dot + "Code Review Agent" wordmark in 13px semibold tracking-tight, then "· pr-review" in 11px muted mono.
- **Right:** user login in 12px muted mono, a 24px round avatar with a 1px border, and the secondary "Sign out" button.

### AuthGate
- **Shape:** the full viewport below the header (calc(100vh − 3rem)), centered column, 32px gaps.
- **Content:** the 12px accent dot + 22px wordmark block, a 13px/1.625 paragraph capped at 440px, the primary GitHub sign-in button, and an 11px muted footer ("Demo · single user · no data is stored").

### StatsBar
- **Shape:** the Issue Cards panel's second header row — 1px dividers above and below, panel fill, 16px gaps, 8px vertical / 16px horizontal padding.
- **Content:** four counters — a 16px semibold tabular number in the grade color (red/amber/green) or primary (Total), paired with an 11px muted label — that shift live as cards stream in. Sits under the 11px uppercase "AI Review" eyebrow and its streaming/done status tag.

### PR header row (center)
- **Shape:** full-width chrome bar, panel fill, 1px #30363d bottom border, 10px vertical padding — the only non-list chrome inside the main column.
- **Content:** the PR number in 13px accent mono beside the 13px medium title (truncating), a muted 11px stats line (green/red tabular +/−, file count, age), and a signal pill — "Reviewing" (accent tint, 6px dot) or "Finished" (low-green tint, 6px dot).

## Do's and Don'ts

### Do:
- **Do** keep the shell on the four-step navy/zinc ladder (#0d1117 → #161b22 → #1c2128 → #21262d). Everything between two surfaces is a tone step and a 1px border.
- **Do** set tabular numerals on every number that is data — stars, counts, +/− deltas, line numbers, stat totals.
- **Do** let severity read in exactly two places: the Issue Card rail/badge and the diff line flash. Ring and flash, never a repainted border or a shadow.
- **Do** keep the signature interaction intact: clicking a card flashes its line (900ms severity background + inset ring), and clicking a line pulses its card (600ms severity box-shadow). Anything that breaks the bidirectional link breaks the product.
- **Do** let cards stream in with the 240ms fade-rise at a 650ms stagger — it is the AI "talking," and it is the only authored motion in the system. Honor prefers-reduced-motion.
- **Do** give interactive diff lines real keyboard semantics (role, Tab, Enter, aria-label) — they are buttons inside a <pre>.

### Don't:
- **Don't** put a kicker or eyebrow above a heading. Section labels stand alone as uppercase eyebrows above their lists, or beside data — never a caption stacked over a title (that is the dashboard-card convention this console rejects).
- **Don't** use gradient text or gradient fills. Type is flat; severity reads through a solid 3px rail and a solid badge tint. Gradients read as marketing and do not exist in this world.
- **Don't** repaint card borders to signal state. Issue Cards keep the neutral 1px #30363d border in every state; the active state announces itself with an indigo ring and a severity pulse.
- **Don't** use severity colors anywhere outside issue grade (and the Finished pill). No red error states outside findings, no green success toasts, no amber warnings in chrome.
- **Don't** lift surfaces with shadows. Tone and borders are the depth system. If a surface needs to feel closer, it gets the next ladder step — never a box-shadow.
- **Don't** introduce a second accent. One indigo voice, or none. Purple, teal, or brand-blue variants break the palette's single act of loudness.
- **Don't** set code, file paths, PR numbers, or line numbers in the sans font — the two-voice rule is not decorative.
