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

import { LEAGUES } from './leagues'

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
    await Promise.all(LEAGUES.map((l) => fetchScheduleForLeague(l.lolesportsId)))
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
