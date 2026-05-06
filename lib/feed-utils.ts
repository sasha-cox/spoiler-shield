import { REGIONS } from '@/lib/regions'
import { leagueBySlug } from '@/lib/leagues'
import { canonicalize } from '@/lib/team-registry'
import { UNOFFICIAL_DEDUPE_WINDOW_DAYS } from '@/lib/constants'
import type { ScheduledMatch } from '@/lib/lolesports'
import type { VodCandidate } from '@/lib/match-vod-resolver'
import type { FeedDay, FeedMatch } from '@/lib/types'
import type { BuiltRegistryShape } from '@/lib/team-registry'

export type FeedFormat = 'bo1' | 'bo3' | 'bo5'

export interface RawUpload {
  videoId: string
  title: string
  publishedAt: Date
  channelName: string
}

export function getDateLabel(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatEventName(scheduled: ScheduledMatch): string {
  const block = scheduled.blockName ? ` ${scheduled.blockName}` : ''
  return `${scheduled.leagueName}${block}`.trim()
}

function dateOf(scheduled: ScheduledMatch): string {
  return scheduled.startTime.slice(0, 10)
}

function matchupKey(teamA: string, teamB: string): string {
  return [teamA, teamB].sort().join('|')
}

/**
 * Builds the spoiler-safe feed from canonical schedule data plus resolved VOD
 * uploads. Matches without a resolved VOD are dropped — we can't show a card
 * a user can't watch. Optionally folds in unofficial matches (showmatches,
 * creator tournaments) parsed from orphan uploads.
 *
 * Region is derived from the league's canonical regionId via leagueBySlug,
 * not by title-parsing the event name — the schedule already tells us which
 * region we're in.
 */
export function buildFeedFromSchedule(
  schedule: ScheduledMatch[],
  vodsByMatchId: Map<string, VodCandidate>,
  registry: BuiltRegistryShape,
  unofficialMatches: FeedMatch[] = [],
): FeedDay[] {
  const dayMap = new Map<string, FeedMatch[]>()

  for (const scheduled of schedule) {
    const vod = vodsByMatchId.get(scheduled.id)
    if (!vod) continue

    const teamAName = canonicalize(registry, scheduled.teamA.name, scheduled.teamA.code)
    const teamBName = canonicalize(registry, scheduled.teamB.name, scheduled.teamB.code)
    const league = leagueBySlug(scheduled.leagueSlug)
    const regionId = league?.regionId ?? 'INT'
    const region = REGIONS[regionId]
    const dateStr = dateOf(scheduled)

    const match: FeedMatch = {
      id: scheduled.id,
      kind: 'official',
      teamA: teamAName,
      teamB: teamBName,
      teamACode: scheduled.teamA.code,
      teamBCode: scheduled.teamB.code,
      eventName: formatEventName(scheduled),
      format: scheduled.format,
      youtubeVideoId: vod.upload.videoId,
      channelName: vod.upload.channelName,
      watched: false,
      publishedAt: vod.upload.publishedAt.toISOString(),
      region: regionId,
      regionLabel: league?.name ?? region.label,
      regionFlag: region.flag,
      regionColor: region.color,
    }

    if (!dayMap.has(dateStr)) dayMap.set(dateStr, [])
    dayMap.get(dateStr)!.push(match)
  }

  // Track each official matchup's date so unofficial entries for the same
  // matchup within +/- N days get suppressed (covers schedule-vs-upload date
  // skew when a coverage upload posts a day or two after the match).
  const officialMatchupDates = new Map<string, number[]>()
  for (const [dateStr, matches] of dayMap.entries()) {
    const t = Date.parse(dateStr + 'T00:00:00Z')
    for (const m of matches) {
      const key = matchupKey(m.teamA, m.teamB)
      if (!officialMatchupDates.has(key)) officialMatchupDates.set(key, [])
      officialMatchupDates.get(key)!.push(t)
    }
  }

  const dedupWindowMs = UNOFFICIAL_DEDUPE_WINDOW_DAYS * 24 * 60 * 60 * 1000

  for (const unofficial of unofficialMatches) {
    const date = unofficial.publishedAt?.slice(0, 10)
    if (!date) continue
    const t = Date.parse(date + 'T00:00:00Z')
    const conflicts = officialMatchupDates.get(matchupKey(unofficial.teamA, unofficial.teamB)) ?? []
    if (conflicts.some((c) => Math.abs(c - t) <= dedupWindowMs)) continue
    if (!dayMap.has(date)) dayMap.set(date, [])
    dayMap.get(date)!.push(unofficial)
  }

  return [...dayMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, matches]) => ({
      date,
      label: getDateLabel(date),
      matches: matches.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')),
    }))
}
