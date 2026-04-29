import { auth } from '@/lib/auth'
import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { buildFeedFromUploads } from '@/lib/feed-utils'
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

  const allUploads: RawUpload[] = []
  for (const channel of MONITORED_CHANNELS) {
    const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, 21)
    for (const upload of uploads) {
      allUploads.push({ ...upload, channelName: channel.name })
    }
  }

  return buildFeedFromUploads(allUploads)
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
