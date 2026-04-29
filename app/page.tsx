import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { FeedClient } from '@/components/FeedClient'
import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { buildFeedFromUploads } from '@/lib/feed-utils'
import type { RawUpload } from '@/lib/feed-utils'
import type { FeedDay } from '@/lib/types'

async function fetchFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  const allUploads: RawUpload[] = []
  for (const channel of MONITORED_CHANNELS) {
    const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, 21)
    for (const upload of uploads) {
      allUploads.push({ ...upload, channelName: channel.name })
    }
  }

  return buildFeedFromUploads(allUploads)
}

export const revalidate = 180 // Cache for 3 minutes

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')

  const feed = await fetchFeed()
  return <FeedClient initialFeed={feed} userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} userImage={session.user?.image ?? undefined} />
}
