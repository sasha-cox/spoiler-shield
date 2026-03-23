import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { buildFeedFromUploads } from '@/lib/feed-utils'
import type { RawUpload } from '@/lib/feed-utils'
import type { FeedDay } from '@/lib/types'

// In-memory cache to avoid hammering YouTube API on every request
let cachedFeed: { data: FeedDay[]; timestamp: number } | null = null
const CACHE_TTL_MS = 3 * 60 * 1000 // 3 minutes

async function buildFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set')
    return []
  }

  const allUploads: RawUpload[] = []
  for (const channel of MONITORED_CHANNELS) {
    const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, 20)
    for (const upload of uploads) {
      allUploads.push({ ...upload, channelName: channel.name })
    }
  }

  return buildFeedFromUploads(allUploads)
}

export async function GET() {
  if (cachedFeed && Date.now() - cachedFeed.timestamp < CACHE_TTL_MS) {
    return Response.json(cachedFeed.data)
  }

  const feed = await buildFeed()
  cachedFeed = { data: feed, timestamp: Date.now() }

  return Response.json(feed)
}
