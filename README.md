# Spoiler Shield

Watch League of Legends esports VODs without learning the result. Spoiler Shield aggregates match uploads from a curated set of YouTube channels, filters out non-match content, and surfaces only the information you need to pick a game — teams, event, format, region — never the score.

> **Live:** [spoiler-shield-eight.vercel.app](https://spoiler-shield-eight.vercel.app) — sign in with Google to view the feed.

---

## Why

Esports fans get spoiled constantly: thumbnail expressions, video durations, "Game 3 of 3" titles, the YouTube homepage itself. Spoiler Shield strips all of that away. A match card shows what the match *is*, not how it *went*.

## Features

- **Spoiler-safe match cards** — teams, event name, format (Bo1 / Bo3 / Bo5), and region only. No scores, no result hints, no thumbnails.
- **Toggle-to-reveal upload time** — relative time is hidden behind a "Posted ???" pill so recency doesn't leak the outcome.
- **Multi-channel aggregation** — Caedrel, IWDominate, LS, LCK, LEC, LCS, LPL, CBLOL, and LoL Esports.
- **Smart deduplication** — when multiple channels cover the same match, the preferred upload wins (Caedrel > official league > LoL Esports).
- **Multi-filter feed** — filter by channel, region, format, search query, watched state, or followed teams.
- **Watched + followed state** — persists in `localStorage`, no account state on the server.
- **Day-grouped, animated feed** — Framer Motion entry animations, with `prefers-reduced-motion` respected.
- **Full-screen embedded player** at `/watch/[id]`.

## Tech Stack

| Layer       | Choice                                                  |
| ----------- | ------------------------------------------------------- |
| Framework   | Next.js 16.2.1 (App Router, Turbopack) + React 19       |
| Language    | TypeScript 5                                            |
| Styling     | Tailwind CSS 4 + shadcn 4.1 + Framer Motion 12          |
| Auth        | NextAuth 5 (beta) — Google OAuth                        |
| Data source | YouTube Data API v3                                     |
| Icons       | Lucide React                                            |
| Testing     | Vitest 4 + @testing-library/react 16 + jsdom            |
| Hosting     | Vercel                                                  |

## Architecture

```
app/page.tsx  (Server Component)
  ├── Auth check → redirect to /login if unauthenticated
  ├── fetchFeed()  →  YouTube API  →  parse / filter / dedup  →  FeedDay[]
  └── <FeedClient initialFeed={feed} />

components/FeedClient.tsx  (Client Component — state hub)
  ├── Multi-filter state (useReducer), watched/follow state, refresh
  ├── <FilterBar />        — channels, regions, formats, search, watched, follow
  └── <MatchFeed />        — day-grouped animated list
        └── <MatchCard />  — region badge, format, teams, channel pill, follow star

app/api/feed/route.ts      — Client-side refresh endpoint, 3-minute in-memory cache
app/watch/[id]/page.tsx    — Full-screen YouTube embed
app/login/page.tsx         — Google OAuth sign-in
```

### Feed pipeline

1. `lib/youtube.ts` fetches recent uploads from each monitored channel in `lib/config.ts`.
2. `isMatchContent()` in `lib/feed-utils.ts` filters out interviews, highlights, recaps, and CJK-language uploads.
3. Team names are extracted via alias matching (`lib/team-aliases.ts`), with a regex fallback.
4. Region is detected from event-name keywords first, then team regions (`lib/regions.ts`).
5. Duplicates across channels are collapsed using a channel-preference order.
6. Surviving matches are grouped by date into `FeedDay[]` and passed to `<FeedClient />`.

### Spoiler-safety rules

- The UI **never** renders scores, winners, game counts, or duration.
- Upload time is hidden by default; users opt in per-card.
- Channel name is shown so viewers can choose a co-stream vs. official broadcast, but no metadata about the match outcome ever leaves the server.

### Quota & caching

YouTube Data API v3 allows 10,000 units/day. Each monitored channel costs 1 unit per fetch. The `/api/feed` route caches results for 3 minutes in-memory to keep usage well under quota during traffic spikes.

## Getting Started

### Prerequisites

- Node.js 20+
- A YouTube Data API v3 key
- A Google OAuth client (for NextAuth)

### Install

```bash
git clone git@github.com:sasha-cox/spoiler-shield.git
cd spoiler-shield
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
YOUTUBE_API_KEY=        # YouTube Data API v3 key
GOOGLE_CLIENT_ID=       # Google OAuth client ID
GOOGLE_CLIENT_SECRET=   # Google OAuth client secret
AUTH_SECRET=            # NextAuth secret (any random string)
```

### Run

```bash
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Run the production build
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run lint         # ESLint
```

## Project Structure

```
app/                          # Next.js App Router pages + API routes
  api/feed/route.ts           # Refresh endpoint (cached)
  watch/[id]/page.tsx         # Full-screen YouTube embed
  login/page.tsx              # Google OAuth sign-in
  page.tsx                    # Authenticated feed (server component)

components/
  FeedClient.tsx              # State hub (filters, watched, follows)
  FilterBar.tsx               # Filter controls
  MatchFeed.tsx               # Day-grouped match list
  MatchCard.tsx               # Single match card
  ui/                         # shadcn primitives

lib/
  feed-utils.ts               # Filter, extract, dedup, group pipeline
  config.ts                   # Monitored YouTube channels
  types.ts                    # FeedDay / FeedMatch / filter types
  youtube.ts                  # YouTube API wrapper
  team-aliases.ts             # Canonical team names ↔ aliases
  regions.ts                  # Region detection + flag/colour metadata
  watched-store.ts            # localStorage watched state
  follow-store.ts             # localStorage followed teams
  auth.ts                     # NextAuth config
  utils.ts                    # cn() helper

__tests__/                    # Mirrors source structure
```

## Testing

```bash
npm run test:run
```

The test suite exercises the feed pipeline (filtering, dedup, region detection, team extraction) and the React components (FilterBar reducer, MatchCard rendering). Tests run in jsdom via Vitest.

## Design System

- **Theme:** always dark. Black background, gold accent (`#D4A843`).
- **Tailwind tokens:** `gold`, `gold-dim`, `surface`, `surface-border`, `text-secondary`.
- **Display font:** Oswald (`.font-display`). **Body font:** Geist Sans.
- **Components:** shadcn primitives in `components/ui/`. Use `cn()` from `lib/utils.ts` for class merging.
- **Motion:** Framer Motion for entry animations, gated on `prefers-reduced-motion`.

## Deployment

Deployed on Vercel. Push to `main` triggers a deployment. Set the four environment variables in the Vercel project settings (Production + Preview).

## Contributing

This is a personal project, but PRs and issues are welcome. Before opening a PR:

1. `npm run lint` — must pass with no errors.
2. `npm run test:run` — all tests must pass.
3. `npm run build` — must compile cleanly.

Repository conventions and architectural detail for AI coding agents live in [`CLAUDE.md`](./CLAUDE.md) and [`AGENTS.md`](./AGENTS.md).

## License

No license has been set yet — all rights reserved by default. Open an issue if you'd like to discuss usage.
