@AGENTS.md

# Spoiler Shield

Spoiler-free League of Legends esports VOD discovery platform. Aggregates match uploads from YouTube channels, filters out non-match content, and presents a spoiler-safe feed.

## Tech Stack

- **Framework:** Next.js 16.2.1 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn 4.1 + Framer Motion 12
- **Auth:** NextAuth 5 beta (Google OAuth)
- **Data:** YouTube Data API v3
- **Icons:** Lucide React
- **Testing:** Vitest 4 + @testing-library/react 16 + jsdom

## Architecture

```
app/page.tsx (Server Component)
  ├── Auth check → redirect to /login if unauthenticated
  ├── fetchFeed() → YouTube API → parse/filter/dedup → FeedDay[]
  └── <FeedClient initialFeed={feed} />

components/FeedClient.tsx (Client Component — state hub)
  ├── Manages filter state, watched state, refresh
  ├── <FilterBar /> — channel filtering pills
  └── <MatchFeed /> — day-grouped animated list
        └── <MatchCard /> — individual match with region badge, format, teams

app/api/feed/route.ts — Client-side refresh endpoint with in-memory cache (3 min TTL)
app/watch/[id]/page.tsx — Full-screen YouTube embed player
app/login/page.tsx — Google OAuth sign-in
```

## Data Flow

1. YouTube API fetches recent uploads from monitored channels (`lib/config.ts`)
2. Content filtering removes non-match videos (interviews, highlights, CJK content) via `isMatchContent()`
3. Team extraction uses alias matching (`lib/team-aliases.ts`) then regex fallback
4. Region detection checks event name keywords first, then team regions (`lib/regions.ts`)
5. Deduplication keeps preferred channel per match (Caedrel > official leagues > LoL Esports)
6. Results grouped by date into `FeedDay[]`, passed to client

## Key Conventions

### Design System
- **Theme:** Always dark mode (class `dark` on `<html>`). Black background with gold accents.
- **Gold accent:** CSS variable `--gold: #D4A843`. Use Tailwind token `gold` (e.g., `text-gold`, `bg-gold`) once configured, or `var(--gold)` in inline styles.
- **Display font:** Oswald (via `--font-oswald`). Apply with `.font-display` utility class.
- **Body font:** Geist Sans (via `--font-geist-sans`).
- **Components:** Use shadcn components from `components/ui/`. Use `cn()` from `lib/utils.ts` for conditional class merging.
- **Animations:** Framer Motion for entry animations. Respect `prefers-reduced-motion`.
- **Icons:** Lucide React. Use `size-N` classes for sizing.

### Spoiler Safety
- Never display match results, scores, or outcomes anywhere in the UI.
- Match cards show only: teams, event name, format (Bo1/Bo3/Bo5), region, channel.

### Data
- YouTube API quota: 10,000 units/day. Each channel costs 1 unit per call. Server-side caching (3 min) prevents excessive API usage.
- Team aliases map many spellings to canonical names (50+ teams across 6 regions).
- Regions: KR, EU, NA, CN, BR, INT — each with flag emoji and badge color.
- Watched state persists in browser localStorage (`spoiler-shield-watched` key).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Watch mode tests
npm run test:run     # Single test run
npm run lint         # ESLint
```

## Environment Variables

```
YOUTUBE_API_KEY       # Required: YouTube Data API v3 key
GOOGLE_CLIENT_ID      # Required: Google OAuth client ID
GOOGLE_CLIENT_SECRET  # Required: Google OAuth client secret
AUTH_SECRET            # Required: NextAuth secret
```

## File Organization

```
app/                    # Next.js App Router pages and API routes
components/             # React components (FeedClient, FilterBar, MatchFeed, MatchCard, etc.)
components/ui/          # shadcn base components (Button, Avatar, etc.)
lib/                    # Shared utilities and data
  config.ts             # Monitored YouTube channels
  types.ts              # TypeScript interfaces (FeedMatch, FeedDay, FeedGameEntry)
  youtube.ts            # YouTube API wrapper
  team-aliases.ts       # Team name normalization (canonical → aliases)
  regions.ts            # Region detection and metadata (flags, colors)
  watched-store.ts      # localStorage watched state manager
  auth.ts               # NextAuth configuration
  utils.ts              # cn() utility
__tests__/              # Test files mirroring source structure
```
