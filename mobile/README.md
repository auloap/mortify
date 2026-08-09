# Mortify — mobile client

Expo (React Native + TypeScript, Expo Router) client for Mortify. Talks to the
Next.js API in the repo root over HTTPS — see `../CONTEXT.md` for the overall
architecture.

## Get started

1. Copy `.env.example` to `.env.local` and point `EXPO_PUBLIC_API_URL` at the
   backend (the repo root's `npm run dev`, or the deployed Railway URL).
2. `npm install`
3. `npx expo start`

## Structure

- `src/app/` — Expo Router screens. `(tabs)/` is the authenticated tab group
  (Treat, Text, Task, Test, Triumph, Prayer Lock, More); `login.tsx` /
  `register.tsx` are outside it.
- `src/lib/api.ts` — `apiFetch`/`apiJson`, mirroring the old web app's
  `tgFetch`/`tgJson` contract: `apiJson` throws on a non-OK response so a
  failed request never gets treated as the data it asked for.
- `src/lib/auth-context.tsx` — session state (`SecureStore`-backed token),
  `login`/`register`/`logout`.
- `src/lib/types.ts` — data types ported verbatim from the old
  `MortifyApp.tsx`.
- `src/constants/theme.ts` — `TabColors` (per-tab accent palette).
- `src/components/ui.tsx` — shared form/card primitives used across tabs.

## Notes

- Not on Expo Go for long: once the native app-blocking module lands
  (Prayer Lock, phases 5–6 of the build), this moves to an Expo dev client.
- SDK 57 changed some conventions from older Expo knowledge (router root is
  `src/app`, not `app/`; `expo-router/unstable-native-tabs` exists but this
  project uses the stable `Tabs` API instead). See the scaffold's own
  `AGENTS.md` note.
