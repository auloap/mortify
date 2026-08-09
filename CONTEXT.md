# Mortify — Spiritual Growth Tracker

## What this app is
A personal spiritual discipline app with two core tracks:
- **Level 1 — Quiet Time**: Daily Bible reading logger with guided reflection questions. Goal: grow love for God.
- **Level 2 — Mortify**: Sin tracker with emotional trigger analysis. Goal: kill sin at the root.

Plus a Triumph tab (Do/Resist goals, wins log) and a Prayer Lock feature in progress —
an OS-level app blocker that locks distracting apps until the user prays.

## Architecture (mid-rewrite, Aug 2026)
Originally a Telegram Mini App. Now being rebuilt as a **native mobile app**, because Prayer
Lock's core mechanic — blocking other apps on the phone — needs OS permissions (iOS Family
Controls, Android Usage Access) a webview can never get.

- **`/` (this repo root)** — Next.js app, now a **pure JSON API backend only**. No UI of its
  own beyond a placeholder root page. Deploys to Railway.
- **`mobile/`** — Expo (React Native + TypeScript) app, the actual client. Talks to this
  repo's `/api/*` routes over HTTPS. *(Scaffolding in progress — see task list / plan history
  before assuming it exists.)*

## Auth
Real accounts, not Telegram initData. `users` (email + bcrypt password hash) and `sessions`
(opaque Bearer token, 90-day expiry) tables in `lib/db.ts`. `POST /api/auth/register` and
`POST /api/auth/login` return a token; every other `/api/*` route requires
`Authorization: Bearer <token>`, validated in `middleware.ts`, which resolves it to an
`x-user-id` header exactly as the old Telegram middleware did — so `lib/auth.ts`'s
`getUserId()` and all 19 pre-existing API routes are unchanged.

## Core features
- QT logger: book/passage selector, 4 guided questions, AI pastoral reflection on submit
- Sin tracker: sin category, 56 emotions across 8 families, situation/counterfeit/post-mortem fields, AI mortification + gospel pivot on submit
- Triumph: Do goals (daily habit streaks) and Resist goals (win-rate against named temptations), one-off wins log
- Patterns dashboard: QT streak, books read chart, sin frequency chart, emotional trigger chart, stronghold detection (4+ occurrences)
- History: QT entries show user's own words only; sin entries show entry + one-sentence AI recaps
- Prayer Lock (in progress): mood tap → AI-generated scripture-rooted prayer → real app blocking via native modules once phases 5–6 land

## Tech stack
- Backend: Next.js 16 (app router), API-only
- Postgres via `postgres.js` (`lib/db.ts`), hosted on Railway
- Anthropic API (`claude-sonnet-4-6`) via server-side API routes, prompts centralized in `lib/buildSystemPrompt.ts` + `lib/prompts/*`
- Client: Expo (React Native, TypeScript, Expo Router) — see `mobile/`

## Design
- Font: Inter
- Per-tab accent palette: treat `#d4890a`, text `#1a7a50`, task `#2d4f8a`, test `#9b2c1a`, triumph `#6d28d9`
- Mobile-first, bottom tab bar

## Current owner
Paulo — personal use, Singapore.

## How to start every session
Read this file first. Then ask what needs to be changed.
