# Mortify — Spiritual Growth Tracker

## What this app is
A personal spiritual discipline app with two core tracks:
- **Level 1 — Quiet Time**: Daily Bible reading logger with guided reflection questions. Goal: grow love for God.
- **Level 2 — Mortify**: Sin tracker with emotional trigger analysis. Goal: kill sin at the root.

## Core features
- QT logger: book/passage selector, 4 guided questions, AI pastoral reflection on submit
- Sin tracker: sin category, 56 emotions across 8 families, situation/counterfeit/post-mortem fields, AI mortification + gospel pivot on submit
- Patterns dashboard: QT streak, books read chart, sin frequency chart, emotional trigger chart, stronghold detection (4+ occurrences)
- History: QT entries show user's own words only; sin entries show entry + one-sentence AI recaps

## Tech stack
- Next.js 14 (app router)
- SQLite via better-sqlite3
- Anthropic API (claude-sonnet-4-20250514) via server-side API route
- Tailwind CSS
- Deployed on Vercel at https://mortify-pi.vercel.app

## Design
- Fonts: Cormorant Garamond + DM Mono
- Colours: paper #f5f0e8, rust #8b3a2a, green #2d6a4f, gold #c9a84c, ink #1a1410
- Mobile-first, bottom nav bar with 4 tabs

## Current owner
Paulo — personal use, Singapore. Future plan: multi-user with individual API keys.

## How to start every session
Read this file first. Then ask what needs to be changed.
