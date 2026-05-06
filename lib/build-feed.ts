/**
 * Pipeline entry point: fetch schedule + uploads, build the team registry,
 * resolve VODs to scheduled matches, fold in unofficial entries, group by
 * day. Both the SSR page (`app/page.tsx`) and the refresh API route
 * (`app/api/feed/route.ts`) call this function — keeps the pipeline in one
 * place so changes never have to be applied twice.
 */

import { getRecentScheduledMatches } from './lolesports'
import { getRecentUploads } from './youtube'
import { MONITORED_CHANNELS } from './config'
import { resolveVodsForSchedule } from './match-vod-resolver'
import { buildUnofficialMatches } from './unofficial-resolver'
import { buildFeedFromSchedule } from './feed-utils'
import { buildRegistryFromSchedule } from './team-registry'
import {
  SCHEDULE_LOOKBACK_DAYS,
  UPLOADS_LOOKBACK_DAYS,
} from './constants'
import type { RawUpload } from './feed-utils'
import type { FeedDay } from './types'

export async function buildFeed(apiKey: string): Promise<FeedDay[]> {
  const [schedule, uploadsByChannel] = await Promise.all([
    getRecentScheduledMatches(SCHEDULE_LOOKBACK_DAYS),
    Promise.all(
      MONITORED_CHANNELS.map(async (channel) => {
        const uploads = await getRecentUploads(channel.youtubeChannelId, apiKey, UPLOADS_LOOKBACK_DAYS)
        return uploads.map((u) => ({ ...u, channelName: channel.name }))
      }),
    ),
  ])

  const registry = buildRegistryFromSchedule(schedule)
  const allUploads: RawUpload[] = uploadsByChannel.flat()
  const { byMatchId, orphans } = resolveVodsForSchedule(schedule, allUploads)
  const unofficial = buildUnofficialMatches(orphans, registry)
  return buildFeedFromSchedule(schedule, byMatchId, registry, unofficial)
}
