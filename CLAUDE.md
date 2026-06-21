# Inara OS — Design System Brief

This file tells you (Claude Code) how every screen in this app must look.
Read it before building or editing any UI. Consistency matters more than cleverness.

## The feeling
Calm, editorial, premium. Lots of whitespace. White cards floating on a warm cream
canvas. Soft rounded corners, gentle shadows, no harsh lines or loud colour.
Reference: the two Inara mockup PNGs in /design-reference. Match that look.

## Colour palette (use ONLY these)
| Token | Hex | Use it for |
|-------|-----|-----------|
| cream | #F4F0EE | Page background. The canvas. Never put text directly on cream as a card. |
| white | #FFFFFF | Card surfaces. All content sits in white cards on the cream. |
| ink | #323642 | Primary text and dark headings. |
| navy | #424B63 | Primary buttons, links, active nav item, focus rings. |
| bluegrey | #B7C1CB | Borders, dividers, muted/secondary text, inactive icons. |
| sage | #BABEAF | Calm accent — positive/"good" status badges, soft success states. |
| blush | #ECD6CE | Warm accent — highlight tags, gentle attention badges. |

Use the Tailwind names directly: bg-cream, bg-card, text-ink, bg-primary,
border-border, text-muted-foreground. Existing shadcn components already inherit
these via the semantic tokens — don't override them with arbitrary hex.

## Typography
- Body / UI text: Atkinson Hyperlegible Next (font-sans).
- Big display headings (page titles, section heroes): Cormorant Garamond (font-display).
- Body text colour is ink; sub-text and labels are muted-foreground (softened ink).

## Components — build these as reusable pieces first, then compose pages from them
Before building full pages, make sure these exist in src/components/ui/ (or extend
the shadcn ones). Every page reuses them so the look stays identical everywhere.
- Card — white, rounded-lg, shadow-card, generous padding (p-5/p-6).
- StatTile — label (muted, small) + big value (ink). Used in dashboard KPI rows.
- Badge — small pill. Variants: sage (good), blush (highlight), bluegrey (neutral),
  navy (primary). Rounded-full, subtle background, ink/dark text.
- ScoreGauge — circular donut with a number in the middle (the lead-score look).
- KanbanColumn + KanbanCard — for pipeline-style boards.
- GoalStrip — the soft full-width "Goal: ..." strip at the bottom of a card.
- SectionHeader — display-font title + small muted subtitle.

## Layout rules
- App shell: left sidebar (white or cream, navy active item) + cream main area.
- Main content max-width container, comfortable gutters, never edge-to-edge text.
- Default spacing is generous. When unsure, add more whitespace, not less.
- Corners: rounded-lg on cards, rounded-full on badges/avatars/pills.
- Shadows: only shadow-card. No heavy drop shadows.

## What to avoid
- No pure black (#000). Darkest is ink (#323642).
- No bright/saturated colours outside the palette.
- No dense, cramped tables — give rows breathing room like the mockups.
- Don't invent new accent colours per page. Reuse the six.

## Workflow for a new page
1. Look at the matching mockup in /design-reference.
2. Reuse existing base components — only build new ones if genuinely missing.
3. Match spacing, hierarchy, and badge usage to the mockup.
4. Keep it consistent with pages already built.
