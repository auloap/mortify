# Mortify — Spiritual Growth Tracker (Telegram Mini App)

## What this app is
A spiritual discipline app built around a daily liturgy and an honest war on sin:
- **Treat** — gratitude log (see the Giver behind the gifts)
- **Text** — daily Bible reading with guided reflection questions
- **Task** — one concrete act of obedience for the day
- **Test** — temptation log, win or loss, with emotional trigger analysis
- Runs as a **Telegram Mini App** with per-user data isolation (initData auth in middleware).

## Information architecture (2026 redesign)
Three places and one act, in a bottom nav:
- **Today** — home screen: greeting, one-line mood check-in, the day's rhythm
  (Treat/Text/Task + custom do-habits) as a checklist, latest AI "grace" resurfaced,
  AI day summary. Rhythm rows open guided one-question-per-screen flows.
- **Tempted?** — raised centre action, reachable from anywhere. Forks by moment:
  "I'm in it right now" → dark SOS screen (breathing ring, 1 Cor 10:13, quick pull
  chips, log-the-stand); "It's passed" → full anatomy flow (sin → outcome →
  emotions by family → situation → win/loss branch).
- **Patterns** — 30-day analytics: stronghold lead card (4+ losses) with companion
  trigger, win-rate stats, wins/losses bars, trigger insight, resist goals, wins log, books.
- **Journal** — unified filterable timeline of all four entry kinds.

## Tech stack
- Next.js 16 (app router), React 19
- Postgres via postgres.js (`lib/db.ts`), per-user rows keyed by Telegram user id
- Anthropic API via server-side routes (`lib/prompts/`, `buildSystemPrompt.ts`)
- Tailwind v4 (CSS-first) + handwritten token system in `app/globals.css`
- Deployed on Vercel at https://mortify-pi.vercel.app

## Design system
- Fonts: Cormorant Garamond (the asking voice — questions, titles), system humanist
  sans (UI and answers), DM Mono (dates and data)
- Tokens in `globals.css`: paper `#f4efe4` / ink `#241b12` ground with day + night
  themes (`data-theme` on `<html>`, synced to Telegram `colorScheme`)
- Accent rule: **rust `#8b3a2a` speaks only about temptation, green `#2d6a4f` only
  about grace, gold `#c9a84c` underlines and never shouts.** One accent per screen.
- Single-weight glyphs, not emoji: ❧ treat · ✜ text · ✦ task/today · ⚔ test · ◐ patterns
- Type floor: nothing below 10.5px.

## Telegram integration (`app/components/telegram.ts`)
- MainButton submits every guided-flow step (in-page fallback shown in browsers,
  hidden via `tg-has-mainbutton` class on `<html>`)
- BackButton steps back through flows; vertical swipes locked during flows
- Haptics on victories, warnings on stronghold-adjacent saves
- SDK loads as a plain blocking `<script>` in `layout.tsx` — initData must exist
  before hydration or the first API calls go out unauthenticated. Do not defer it.

## Current owner
Paulo — Singapore. Multi-user via Telegram; each user gets isolated data.

## How to start every session
Read this file first. Then ask what needs to be changed.
