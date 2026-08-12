# Scout — Video Finder

Search and filter YouTube videos by your own criteria — description, duration,
sort order, publish date, content filter — with "Find similar" to seed a new
search from any result you already found.

Stack: **Next.js 16 (App Router) + TypeScript + PostgreSQL (Prisma)**.

## Why Postgres is used for

- **Settings** — your YouTube API key, encrypted at rest (AES-256-GCM), so the
  browser never has to hold it after you save it once. All YouTube calls run
  server-side in Next.js Route Handlers.
- **Search history** — every query is logged, useful for auditing quota usage.
- **Saved library** — bookmark any result; it persists across sessions and
  powers the "Find similar" seed on saved items too.

## 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local, Docker, Supabase, Neon, RDS — anything)
- A free YouTube Data API v3 key (the app walks you through getting one once
  it's running)

## 2. Install

```bash
npm install
```

## 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

- `DATABASE_URL` — your Postgres connection string
- `ENCRYPTION_SECRET` — generate with `openssl rand -hex 32`

## 4. Set up the database

```bash
npm run db:migrate
```

This creates the `Setting`, `SearchHistory`, and `SavedVideo` tables.

## 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), open the **Signal
source** panel, and paste in your YouTube API key. Then search.

## Project layout

```
src/
  app/
    page.tsx              # main UI, client component holding app state
    layout.tsx             # root layout, loads fonts via next/font
    globals.css            # design tokens + component styles
    api/
      settings/route.ts     # GET/POST/DELETE the encrypted API key
      search/route.ts        # POST: server-side YouTube search + logging
      videos/save/route.ts    # POST/DELETE a saved video
      videos/saved/route.ts    # GET the saved library
  components/               # SearchConsole, ResultsGrid, VideoCard, etc.
  lib/
    prisma.ts               # Prisma client singleton
    crypto.ts                # AES-256-GCM encrypt/decrypt for the API key
    youtube.ts                # YouTube Data API client + duration parsing
    format.ts                  # view-count/date display formatting
  types/video.ts             # shared VideoResult / SearchFilters types
prisma/schema.prisma         # database schema
```

## Notes

- Only YouTube is wired up, since it's the platform with a free, public
  search API. Other sources (Vimeo, etc.) could be added the same way —
  a new client in `lib/`, called from a new route in `app/api/`.
- This app doesn't host, rehost, or download any video — it only calls
  YouTube's official API and links out or embeds their official player.
- `viewCount` is stored as `BigInt` in Postgres but converted to `Number`
  before it reaches the client — fine for realistic view counts, but worth
  knowing if you extend the schema.
