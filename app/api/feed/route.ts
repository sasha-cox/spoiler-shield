import { auth } from '@/lib/auth'
import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { getRecentScheduledMatches } from '@/lib/lolesports'
import { resolveVodsForSchedule } from '@/lib/match-vod-resolver'
import { buildUnofficialMatches } from '@/lib/unofficial-resolver'
import { buildFeedFromSchedule } from '@/lib/feed-utils'
import type { RawUpload } from '@/lib/feed-utils'
import type { FeedDay } from '@/lib/types'

let cachedFeed: { data: FeedDay[]; timestamp: number } | null = null
const CACHE_TTL_MS = 3 * 60 * 1000

const recentRequestsByUser = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 20

function isRateLimited(userKey: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS
  const recent = (recentRequestsByUser.get(userKey) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT_MAX) {
    recentRequestsByUser.set(userKey, recent)
    return true
  }
  recent.push(now)
  recentRequestsByUser.set(userKey, recent)
  return false
}

async function buildFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set')
    return []
  }

  const [schedule, uploadsByChannel] = await Promise.all([
    getRecentScheduledMatches(28),
    Promise.all(
      MONITORED_CHANNELS.map(async (channel) => {
        const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, 21)
        return uploads.map((u) => ({ ...u, channelName: channel.name }))
      }),
    ),
  ])

  const allUploads: RawUpload[] = uploadsByChannel.flat()
  const { byMatchId, orphans } = resolveVodsForSchedule(schedule, allUploads)
  const unofficial = buildUnofficialMatches(orphans)
  return buildFeedFromSchedule(schedule, byMatchId, unofficial)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userKey = session.user.email ?? session.user.id ?? 'unknown'
  if (isRateLimited(userKey)) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  if (cachedFeed && Date.now() - cachedFeed.timestamp < CACHE_TTL_MS) {
    return Response.json(cachedFeed.data)
  }

  const feed = await buildFeed()
  cachedFeed = { data: feed, timestamp: Date.now() }

  return Response.json(feed)
}
