# DriftScout

A community-driven map of drifting practice spots. Drivers discover safe, vetted locations to practice; scouts submit and maintain them.

**Live:** https://drift-scout.vercel.app

## What it does

DriftScout is a community map of drifting practice spots — drivers share, find, and vet locations. It's a mobile-first web app where the community catalogues parking lots and facilities, with the access details that matter: fee, permission level, and surface.

## Features

**Discovery**
- Map view (Leaflet) and card feed, with distance and tag filtering
- Location detail: photos, address, access fee, permission level, tags, submitter notes

**Community**
- Google Sign-In (Supabase Auth), gated by single-use invite codes with a role system (admin / trusted scout)
- Submit spots with photos (client-side compression) and tags
- Like/save locations, follow scouts, comment on spots
- Leaderboard of top submitters; photo contributions with voting
- In-app notifications

**Trust & safety**
- Admin moderation: user management and a community bug-report channel

**Platform**
- Installable PWA, responsive (desktop sidebar ↔ mobile bottom-sheet)
- Avatar upload with crop

## Stack

| Layer | Choice |
| --- | --- |
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Data | Supabase (Postgres, Auth, Storage) |
| Maps | Leaflet + react-leaflet |
| Motion | Framer Motion |
| PWA | vite-plugin-pwa |
| Tests | Playwright |
| Deploy | Vercel |

## Architecture

```
src/
  lib/        Supabase client + data-access modules (locations, comments, likes, …)
  hooks/      Feature hooks (useAuth, useLocations, useLeaderboard, …)
  pages/      Routes (React Router)
  components/ Presentational UI
supabase/     SQL migrations (schema + seed)
tests/        Playwright end-to-end specs
```

The frontend talks directly to Supabase (PostgREST + Auth). Schema is plain SQL tracked in `supabase/` and applied in the Supabase SQL editor, oldest → newest.

## Run it locally

```bash
npm install
```

Create a git-ignored `.env.local` with your Supabase project keys:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Apply the migrations in `supabase/` to your Supabase project, then:

```bash
npm run dev          # dev server on :5173
npx playwright test  # end-to-end tests
```

## Deploy

Deployed to Vercel; `vercel.json` rewrites all routes to `index.html` for the SPA. Production build: `npm run build` → `dist/`.

## Status

Shipped and live. Next up: surface-quality field on spots and richer filtering.
