/**
 * Client for the (unofficial-but-stable) lolesports.com schedule API.
 * Used by lolesports.com itself; same data Riot publishes on the official site.
 *
 * IMPORTANT: the upstream API includes match results (winner, gameWins, record).
 * This module strips all of that BEFORE the data leaves the function — nothing
 * spoiler-relevant ever reaches a client. Treat the upstream response as
 * radioactive: handle once, sanitize, throw the rest away.
 */

const API_BASE = 'https://esports-api.lolesports.com/persisted/gw'
const PUBLIC_API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

function getApiKey(): string {
  return process.env.LOLESPORTS_API_KEY || PUBLIC_API_KEY
}

export interface ScheduledMatch {
  /** lolesports canonical match ID — stable across reschedules */
  id: string
  leagueSlug: string
  leagueName: string
  /** "Week 5", "Round 4", "Spring Playoffs Round 1", etc. */
  blockName: string
  /** ISO 8601 — official scheduled start, even if completed */
  startTime: string
  teamA: { name: string; code: string }
  teamB: { name: string; code: string }
  format: 'bo1' | 'bo3' | 'bo5'
  /** Whether the match has actually happened. We do NOT expose who won — only
   *  whether a VOD is available. */
  hasVod: boolean
}

interface RawTeam {
  name?: string
  code?: string
}

interface RawMatch {
  id?: string
  flags?: string[]
  teams?: RawTeam[]
  strategy?: { type?: string; count?: number }
}

interface RawEvent {
  startTime?: string
  state?: string
  type?: string
  blockName?: string
  league?: { name?: string; slug?: string }
  match?: RawMatch
}

interface ScheduleResponse {
  data?: { schedule?: { events?: RawEvent[]; pages?: { older?: string | null } } }
}

/**
 * Leagues whose matches we surface in the feed. Each entry is a slug + ID
 * straight from `getLeagues`. Adding a new league = one line; the rest of
 * the pipeline picks it up automatically.
 *
 * Tier-1 official + tier-2 official + international + creator-relevant
 * (NLC has Caedrel's Los Ratones, LFL/Prime League/EMEA Masters get cast
 * frequently). For events that aren't on lolesports at all (showmatches,
 * Twitch Rivals, etc.), the unofficial-resolver layer takes over.
 */
const TRACKED_LEAGUES: Array<{ slug: string; id: string }> = [
  // Tier-1
  { slug: 'lck',          id: '98767991310872058' },
  { slug: 'lec',          id: '98767991302996019' },
  { slug: 'lcs',          id: '98767991299243165' },
  { slug: 'lpl',          id: '98767991314006698' },
  { slug: 'cblol-brazil', id: '98767991332355509' },
  { slug: 'lcp',          id: '113476371197627891' },
  // Tier-2
  { slug: 'nlc',                    id: '105266098308571975' },
  { slug: 'lfl',                    id: '105266103462388553' },
  { slug: 'primeleague',            id: '105266091639104326' },
  { slug: 'hitpoint_masters',       id: '105266106309666619' },
  { slug: 'lck_challengers_league', id: '98767991335774713' },
  { slug: 'nacl',                   id: '109511549831443335' },
  { slug: 'cd',                     id: '105549980953490846' },
  { slug: 'ljl-japan',              id: '98767991349978712' },
  { slug: 'vcs',                    id: '107213827295848783' },
  // International
  { slug: 'worlds',       id: '98767975604431411' },
  { slug: 'msi',          id: '98767991325878492' },
  { slug: 'first_stand',  id: '113464388705111224' },
  { slug: 'emea_masters', id: '100695891328981122' },
  { slug: 'americas_cup', id: '116096325848746167' },
]

let scheduleCache: { data: ScheduledMatch[]; timestamp: number } | null = null
const SCHEDULE_CACHE_TTL_MS = 30 * 60 * 1000

function sanitizeEvent(event: RawEvent): ScheduledMatch | null {
  if (event.type !== 'match') return null
  if (!event.startTime) return null
  if (!event.league?.slug || !event.league?.name) return null
  const match = event.match
  if (!match?.id) return null
  if (!match.teams || match.teams.length !== 2) return null
  const [a, b] = match.teams
  if (!a?.name || !a?.code || !b?.name || !b?.code) return null
  // Skip TBD placeholder teams (shown for not-yet-scheduled bracket slots).
  if (a.code === 'TBD' || b.code === 'TBD') return null

  const bestOf = match.strategy?.count ?? 1
  const format: ScheduledMatch['format'] =
    bestOf >= 5 ? 'bo5' : bestOf >= 3 ? 'bo3' : 'bo1'

  return {
    id: match.id,
    leagueSlug: event.league.slug,
    leagueName: event.league.name,
    blockName: event.blockName ?? '',
    startTime: event.startTime,
    teamA: { name: a.name, code: a.code },
    teamB: { name: b.name, code: b.code },
    format,
    hasVod: (match.flags ?? []).includes('hasVod'),
  }
}

async function fetchScheduleForLeague(leagueId: string, signal?: AbortSignal): Promise<ScheduledMatch[]> {
  const url = new URL(`${API_BASE}/getSchedule`)
  url.searchParams.set('hl', 'en-US')
  url.searchParams.set('leagueId', leagueId)
  const res = await fetch(url, {
    headers: { 'x-api-key': getApiKey() },
    signal,
  })
  if (!res.ok) {
    console.error(`lolesports schedule fetch failed for ${leagueId}: ${res.status}`)
    return []
  }
  const data: ScheduleResponse = await res.json()
  const events = data.data?.schedule?.events ?? []
  const matches: ScheduledMatch[] = []
  for (const event of events) {
    const m = sanitizeEvent(event)
    if (m) matches.push(m)
  }
  return matches
}

/**
 * Returns scheduled matches across all tracked leagues whose start time is
 * within the last `sinceDays`. Cached for 30 minutes to keep us light on the
 * upstream API and our own cold-start latency.
 */
export async function getRecentScheduledMatches(sinceDays: number = 28): Promise<ScheduledMatch[]> {
  if (scheduleCache && Date.now() - scheduleCache.timestamp < SCHEDULE_CACHE_TTL_MS) {
    return filterByDate(scheduleCache.data, sinceDays)
  }

  const all = (
    await Promise.all(TRACKED_LEAGUES.map((l) => fetchScheduleForLeague(l.id)))
  ).flat()

  scheduleCache = { data: all, timestamp: Date.now() }
  return filterByDate(all, sinceDays)
}

function filterByDate(matches: ScheduledMatch[], sinceDays: number): ScheduledMatch[] {
  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000
  return matches.filter((m) => {
    const t = Date.parse(m.startTime)
    return Number.isFinite(t) && t >= cutoff
  })
}

/** Test/dev helper — clear the in-memory cache. */
export function clearScheduleCache(): void {
  scheduleCache = null
}
