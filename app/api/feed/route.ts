import { auth } from '@/lib/auth'
import { buildFeed } from '@/lib/build-feed'
import {
  FEED_CACHE_TTL_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
} from '@/lib/constants'
import type { FeedDay } from '@/lib/types'

let cachedFeed: { data: FeedDay[]; timestamp: number } | null = null

const recentRequestsByUser = new Map<string, number[]>()

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

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userKey = session.user.email ?? session.user.id ?? 'unknown'
  if (isRateLimited(userKey)) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  if (cachedFeed && Date.now() - cachedFeed.timestamp < FEED_CACHE_TTL_MS) {
    return Response.json(cachedFeed.data)
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set')
    return Response.json([])
  }

  const feed = await buildFeed(apiKey)
  cachedFeed = { data: feed, timestamp: Date.now() }

  return Response.json(feed)
}
