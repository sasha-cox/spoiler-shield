import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { FeedClient } from '@/components/FeedClient'
import { getRecentUploads } from '@/lib/youtube'
import { MONITORED_CHANNELS } from '@/lib/config'
import { getRecentScheduledMatches } from '@/lib/lolesports'
import { resolveVodsForSchedule } from '@/lib/match-vod-resolver'
import { buildUnofficialMatches } from '@/lib/unofficial-resolver'
import { buildFeedFromSchedule } from '@/lib/feed-utils'
import type { RawUpload } from '@/lib/feed-utils'
import type { FeedDay } from '@/lib/types'

async function fetchFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

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

export const revalidate = 180

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')

  const feed = await fetchFeed()
  return <FeedClient initialFeed={feed} userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} userImage={session.user?.image ?? undefined} />
}
