import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { FeedClient } from '@/components/FeedClient'
import { buildFeed } from '@/lib/build-feed'
import type { FeedDay } from '@/lib/types'

async function fetchFeed(): Promise<FeedDay[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []
  return buildFeed(apiKey)
}

// Literal needed by Next's static analysis. Mirrors FEED_REVALIDATE_SECONDS
// in lib/constants.ts — keep them in sync.
export const revalidate = 180

export default async function Home() {
  const session = await auth()
  if (!session) redirect('/login')

  const feed = await fetchFeed()
  return <FeedClient initialFeed={feed} userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} userImage={session.user?.image ?? undefined} />
}
