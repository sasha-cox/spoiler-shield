import { NextRequest } from 'next/server'
import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { extractTeamsFromTitle as extractTeamsAliased, normalizeTeamName } from '@/lib/team-aliases'
import type { FeedDay, FeedMatch } from '@/lib/types'

// In-memory cache to avoid hammering YouTube API on every request
let cachedFeed: { data: FeedDay[]; timestamp: number } | null = null
const CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutes

function getDateLabel(dateStr: string): string {
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

/**
 * Try to extract a format hint from a video title.
 * Caedrel's titles often contain "BO5", "BO3", "GRAND FINALS" etc.
 */
function guessFormat(title: string): 'bo1' | 'bo3' | 'bo5' {
  const upper = title.toUpperCase()
  if (upper.includes('BO5') || upper.includes('GRAND FINAL')) return 'bo5'
  if (upper.includes('BO3') || upper.includes('SEMI FINAL')) return 'bo3'
  return 'bo1'
}

/**
 * Extract team names from a Caedrel-style title using alias matching.
 * Falls back to raw extraction if aliases don't match.
 */
function extractTeams(title: string): { teamA: string; teamB: string } | null {
  // Try alias-based extraction first (gives canonical names like "G2 Esports")
  const aliased = extractTeamsAliased(title)
  if (aliased) return { teamA: aliased[0], teamB: aliased[1] }

  // Fallback: raw regex extraction for teams not in our alias map
  const vsMatch = title.match(/([A-Za-z0-9\s.]+?)\s+(?:VS|vs|Vs)\s+([A-Za-z0-9\s.]+?)(?:\s*[-–—|]|$)/i)
  if (!vsMatch) return null

  let teamA = vsMatch[1].trim()
  let teamB = vsMatch[2].trim()
  teamA = teamA.replace(/\s+\d{4}$/, '').trim()
  teamB = teamB.replace(/\s+\d{4}$/, '').trim()

  if (!teamA || !teamB) return null
  return { teamA, teamB }
}

/**
 * Extract event name from a Caedrel title.
 * Caedrel's titles look like:
 *   "FIRST STAND GRAND FINALS 2026 - G2 VS BLG"
 *   "G2 VS GENG SEMI FINALS OF FIRST STAND 2026 - CAN THEY REALLY DO IT"
 *   "LOSER GOES HOME - LOUD VS JDG - FIRST STAND 2026"
 *
 * Strategy: strip out the team names, "VS", and filler words to find the event.
 */
function extractEventName(title: string, teamA: string, teamB: string): string {
  // Split by " - " and find segments that don't contain team names
  const segments = title.split(/\s*[-–—]\s*/)

  // Filter out segments that are just team matchups or filler
  const eventSegments = segments.filter(seg => {
    const upper = seg.toUpperCase().trim()
    // Skip segments that are primarily team matchups
    if (/\bVS\b/i.test(upper)) return false
    // Skip very short filler like "CAN THEY REALLY DO IT"
    if (upper.length < 8 && !upper.includes('2026') && !upper.includes('2025')) return false
    return true
  })

  if (eventSegments.length > 0) {
    // Pick the most "event-like" segment (contains year or tournament name)
    const best = eventSegments.find(s => /FIRST STAND|LCK|LEC|LCS|LPL|WORLDS|MSI|PLAYOFF|FINAL|EMEA/i.test(s))
      ?? eventSegments[0]
    return best.trim()
  }

  // Fallback: extract from the full title, removing team names
  let cleaned = title
  cleaned = cleaned.replace(new RegExp(`\\b${teamA}\\b`, 'gi'), '')
  cleaned = cleaned.replace(new RegExp(`\\b${teamB}\\b`, 'gi'), '')
  cleaned = cleaned.replace(/\bVS\b/gi, '')
  cleaned = cleaned.replace(/\s*[-–—]\s*/g, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  return cleaned || title
}

async function buildFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set')
    return []
  }

  // Fetch uploads from all monitored channels
  const allUploads: { videoId: string; title: string; publishedAt: Date; channelName: string }[] = []

  for (const channel of MONITORED_CHANNELS) {
    const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, 20)
    for (const upload of uploads) {
      allUploads.push({ ...upload, channelName: channel.name })
    }
  }

  // Convert uploads to FeedMatches, filtering for match content
  const matches: FeedMatch[] = []
  for (const upload of allUploads) {
    const teams = extractTeams(upload.title)
    if (!teams) continue // Skip non-match content (tier lists, etc.)

    matches.push({
      id: upload.videoId,
      teamA: teams.teamA,
      teamB: teams.teamB,
      eventName: extractEventName(upload.title, teams.teamA, teams.teamB),
      format: guessFormat(upload.title),
      youtubeVideoId: upload.videoId,
      channelName: upload.channelName,
      watched: false,
      _publishedAt: upload.publishedAt.toISOString(),
    } as FeedMatch & { _publishedAt: string })
  }

  // Group by date
  const dayMap = new Map<string, FeedMatch[]>()
  for (const match of matches) {
    const dateStr = (match as any)._publishedAt.slice(0, 10)
    if (!dayMap.has(dateStr)) dayMap.set(dateStr, [])
    dayMap.get(dateStr)!.push(match)
    // Clean up internal field before sending to client
    delete (match as any)._publishedAt
  }

  // Sort days reverse-chronologically
  const sortedDays = [...dayMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayMatches]) => ({
      date,
      label: getDateLabel(date),
      matches: dayMatches,
    }))

  return sortedDays
}

export async function GET(request: NextRequest) {
  // Check cache
  if (cachedFeed && Date.now() - cachedFeed.timestamp < CACHE_TTL_MS) {
    return Response.json(cachedFeed.data)
  }

  const feed = await buildFeed()

  // Update cache
  cachedFeed = { data: feed, timestamp: Date.now() }

  return Response.json(feed)
}
