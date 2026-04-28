import { extractTeamsFromTitle } from '@/lib/team-aliases'
import { getRegion } from '@/lib/regions'
import type { FeedDay, FeedMatch } from '@/lib/types'

export type FeedFormat = 'bo1' | 'bo3' | 'bo5'

export interface RawUpload {
  videoId: string
  title: string
  publishedAt: Date
  channelName: string
}

// Skip non-English and non-match content
const SKIP_KEYWORDS = /인터뷰|interview|highlights|recap|preview|tierlist|tier list|reaction|紀錄|回顧|采访|집중|하이라이트|rankings|flashback|behind the scenes|press conference|#shorts|vertical|compilation|best of|top \d|montage|funny moments/i
const NON_LATIN_HEAVY = /[\u3000-\u9FFF\uAC00-\uD7AF]{5,}/ // 5+ CJK characters = probably not English

// Channel preference for deduplication (lower = preferred)
export const CHANNEL_PRIORITY: Record<string, number> = {
  'Caedrel': 0,
  'IWDominate': 0,
  'LS': 0,
  'LCK': 1,
  'LEC': 1,
  'LCS': 1,
  'LPL': 1,
  'CBLOL': 1,
  'LoL Esports': 2,
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

export function guessFormat(title: string): FeedFormat {
  const upper = title.toUpperCase()
  if (upper.includes('BO5') || upper.includes('GRAND FINAL')) return 'bo5'
  if (upper.includes('BO3') || upper.includes('SEMI FINAL')) return 'bo3'
  return 'bo1'
}

export function extractEventName(title: string, teamA: string, teamB: string): string {
  const segments = title.split(/\s*[-–—]\s*/)
  const eventSegments = segments.filter(seg => {
    const upper = seg.toUpperCase().trim()
    if (/\bVS\b/i.test(upper)) return false
    if (upper.length < 8 && !upper.includes('2026') && !upper.includes('2025')) return false
    return true
  })
  if (eventSegments.length > 0) {
    const best = eventSegments.find(s => /FIRST STAND|LCK|LEC|LCS|LPL|WORLDS|MSI|PLAYOFF|FINAL|EMEA/i.test(s))
      ?? eventSegments[0]
    return best.trim()
  }
  return title
}

export function extractTeams(title: string): { teamA: string; teamB: string } | null {
  const aliased = extractTeamsFromTitle(title)
  if (aliased) return { teamA: aliased[0], teamB: aliased[1] }
  const vsMatch = title.match(/([A-Za-z0-9\s.]+?)\s+(?:VS|vs|Vs)\s+([A-Za-z0-9\s.]+?)(?:\s*[-–—|]|$)/i)
  if (!vsMatch) return null
  const teamA = vsMatch[1].trim().replace(/\s+\d{4}$/, '').trim()
  const teamB = vsMatch[2].trim().replace(/\s+\d{4}$/, '').trim()
  if (!teamA || !teamB) return null
  return { teamA, teamB }
}

export function isMatchContent(title: string): boolean {
  if (SKIP_KEYWORDS.test(title)) return false
  if (NON_LATIN_HEAVY.test(title)) return false
  if (!/\bvs\.?\b/i.test(title)) return false
  return true
}

export function dedupKey(teamA: string, teamB: string, date: string): string {
  return [teamA, teamB].sort().join('|') + '|' + date
}

/**
 * Full pipeline: filter uploads → extract teams/events/regions → dedup → group by date.
 */
export function buildFeedFromUploads(uploads: RawUpload[]): FeedDay[] {
  // Build matches with filtering
  const matches: (FeedMatch & { _date: string })[] = []
  for (const upload of uploads) {
    if (!isMatchContent(upload.title)) continue
    const teams = extractTeams(upload.title)
    if (!teams) continue
    const eventName = extractEventName(upload.title, teams.teamA, teams.teamB)
    const region = getRegion(teams.teamA, teams.teamB, eventName)
    matches.push({
      id: upload.videoId,
      teamA: teams.teamA,
      teamB: teams.teamB,
      eventName,
      format: guessFormat(upload.title),
      youtubeVideoId: upload.videoId,
      channelName: upload.channelName,
      watched: false,
      publishedAt: upload.publishedAt.toISOString(),
      region: region.shortCode,
      regionFlag: region.flag,
      regionColor: region.color,
      _date: upload.publishedAt.toISOString().slice(0, 10),
    })
  }

  // Deduplicate: same teams on same date → keep preferred channel
  const seen = new Map<string, FeedMatch & { _date: string }>()
  for (const match of matches) {
    const key = dedupKey(match.teamA, match.teamB, match._date)
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, match)
    } else {
      const existingPriority = CHANNEL_PRIORITY[existing.channelName ?? ''] ?? 99
      const newPriority = CHANNEL_PRIORITY[match.channelName ?? ''] ?? 99
      if (newPriority < existingPriority) {
        seen.set(key, match)
      }
    }
  }

  // Group by date
  const dayMap = new Map<string, FeedMatch[]>()
  for (const match of seen.values()) {
    const dateStr = match._date
    if (!dayMap.has(dateStr)) dayMap.set(dateStr, [])
    const { _date, ...cleanMatch } = match
    dayMap.get(dateStr)!.push(cleanMatch)
  }

  return [...dayMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayMatches]) => ({
      date,
      label: getDateLabel(date),
      matches: dayMatches,
    }))
}
