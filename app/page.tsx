import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { FeedClient } from '@/components/FeedClient'
import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { extractTeamsFromTitle } from '@/lib/team-aliases'
import { getRegion } from '@/lib/regions'
import type { FeedDay, FeedMatch } from '@/lib/types'

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

function guessFormat(title: string): 'bo1' | 'bo3' | 'bo5' {
  const upper = title.toUpperCase()
  if (upper.includes('BO5') || upper.includes('GRAND FINAL')) return 'bo5'
  if (upper.includes('BO3') || upper.includes('SEMI FINAL')) return 'bo3'
  return 'bo1'
}

function extractEventName(title: string, teamA: string, teamB: string): string {
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

function extractTeams(title: string): { teamA: string; teamB: string } | null {
  const aliased = extractTeamsFromTitle(title)
  if (aliased) return { teamA: aliased[0], teamB: aliased[1] }
  const vsMatch = title.match(/([A-Za-z0-9\s.]+?)\s+(?:VS|vs)\s+([A-Za-z0-9\s.]+?)(?:\s*[-–—|]|$)/i)
  if (!vsMatch) return null
  const teamA = vsMatch[1].trim().replace(/\s+\d{4}$/, '').trim()
  const teamB = vsMatch[2].trim().replace(/\s+\d{4}$/, '').trim()
  if (!teamA || !teamB) return null
  return { teamA, teamB }
}

async function fetchFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  const allUploads: { videoId: string; title: string; publishedAt: Date; channelName: string }[] = []
  for (const channel of MONITORED_CHANNELS) {
    const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, 30)
    for (const upload of uploads) {
      allUploads.push({ ...upload, channelName: channel.name })
    }
  }

  const matches: (FeedMatch & { _date: string })[] = []
  for (const upload of allUploads) {
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
      region: region.shortCode,
      regionFlag: region.flag,
      regionColor: region.color,
      _date: upload.publishedAt.toISOString().slice(0, 10),
    })
  }

  const dayMap = new Map<string, FeedMatch[]>()
  for (const match of matches) {
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

export const revalidate = 180 // Cache for 3 minutes

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')

  const feed = await fetchFeed()
  return <FeedClient initialFeed={feed} userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} userImage={session.user?.image ?? undefined} />
}
