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
  ├── Manages multi-filter state (useReducer), watched/follow state, refresh
  ├── <FilterBar /> — channels, regions, formats, search, watched toggle, team follow
  └── <MatchFeed /> — day-grouped animated list with reduced-motion support
        └── <MatchCard /> — individual match with region badge, format, teams, follow star

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
- **Gold accent:** CSS variable `--gold: #D4A843`. Use Tailwind token `gold` (e.g., `text-gold`, `bg-gold`). Also available: `surface`, `surface-border`, `text-secondary`, `gold-dim`.
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
- Team data (canonical names, aliases, region attributions) lives in `lib/teams.generated.ts`. **Never hand-edit it.** Run `npm run sync:teams` to refresh from Leaguepedia.
- The sync script (`scripts/sync-teams.ts`) hits Leaguepedia's Cargo API and paces requests at 6s with exponential backoff because Fandom rate-limits aggressively.
- Regions: KR, EU, NA, CN, BR, INT — each with flag emoji and badge color.
- Watched state persists in browser localStorage (`spoiler-shield-watched` key).
- Followed teams persist in browser localStorage (`spoiler-shield-follows` key).
- Monitored channels: Caedrel, IWDominate, LS, LCK, LEC, LCS, LPL, CBLOL, LoL Esports.

### Security
- `/api/feed` is auth-gated (returns 401 without a session) and per-user rate limited (20 req/min).
- `/watch/[id]` validates the YouTube video ID against `^[A-Za-z0-9_-]{11}$` and 404s otherwise — required because the ID flows into the embed iframe `src`.
- Anyone with a Google account can sign in (intentional — it's a public app). No allow-list.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Watch mode tests
npm run test:run     # Single test run
npm run lint         # ESLint
npm run sync:teams   # Refresh lib/teams.generated.ts from Leaguepedia
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
components/             # React components (FeedClient, FilterBar, MatchFeed, MatchCard, LoginCard, FeedSkeleton, GameList)
components/ui/          # shadcn base components (Button, Avatar, etc.)
lib/                    # Shared utilities and data
  feed-utils.ts         # Shared feed pipeline (filter, extract, dedup, group)
  config.ts             # Monitored YouTube channels
  types.ts              # TypeScript interfaces and filter types
  youtube.ts            # YouTube API wrapper (typed)
  team-aliases.ts       # extractTeamsFromTitle / normalizeTeamName (reads teams.generated)
  teams.generated.ts    # AUTO-GENERATED by scripts/sync-teams.ts — do not hand-edit
  regions.ts            # REGIONS map + getRegion (reads teams.generated)
  watched-store.ts      # localStorage watched state manager
  follow-store.ts       # localStorage team follow manager
  auth.ts               # NextAuth configuration
  utils.ts              # cn() utility
scripts/
  sync-teams.ts         # Leaguepedia → lib/teams.generated.ts
__tests__/              # Test files mirroring source structure
```
