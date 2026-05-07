/**
 * Local smoke test: runs the production feed pipeline end-to-end against
 * the real lolesports + YouTube APIs and prints what users would see.
 * Run: `pnpm tsx scripts/probe-feed.ts`
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MONITORED_CHANNELS } from '../lib/config.js'
import { getRecentUploads } from '../lib/youtube.js'
import { getRecentScheduledMatches } from '../lib/lolesports.js'
import { resolveVodsForSchedule } from '../lib/match-vod-resolver.js'
import { buildUnofficialMatches } from '../lib/unofficial-resolver.js'
import { buildFeedFromSchedule } from '../lib/feed-utils.js'
import { buildRegistryFromSchedule } from '../lib/team-registry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
const apiKey = envFile
  .split('\n')
  .map((l) => l.trim())
  .find((l) => l.startsWith('YOUTUBE_API_KEY='))
  ?.slice('YOUTUBE_API_KEY='.length)
if (!apiKey) {
  console.error('YOUTUBE_API_KEY not in .env.local')
  process.exit(1)
}

async function main() {
  console.log('Fetching schedule + uploads in parallel...\n')
  const [schedule, uploadsByChannel] = await Promise.all([
    getRecentScheduledMatches(28),
    Promise.all(
      MONITORED_CHANNELS.map(async (channel) => {
        const ups = await getRecentUploads(channel.youtubeChannelId, apiKey!, 21)
        return ups.map((u) => ({ ...u, channelName: channel.brand }))
      }),
    ),
  ])

  const allUploads = uploadsByChannel.flat()
  console.log(`schedule: ${schedule.length} matches`)
  console.log(`uploads:  ${allUploads.length}`)

  const registry = buildRegistryFromSchedule(schedule)
  const { byMatchId, orphans } = resolveVodsForSchedule(schedule, allUploads)
  console.log(`resolved: ${byMatchId.size} matches with VODs`)
  console.log(`orphans:  ${orphans.length} uploads`)
  console.log(`registry: ${registry.canonicals.size} canonical teams`)

  const unofficial = buildUnofficialMatches(orphans, registry)
  console.log(`unofficial: ${unofficial.length} parsed from orphans\n`)

  const feed = buildFeedFromSchedule(schedule, byMatchId, registry, unofficial)
  console.log(`Feed: ${feed.length} days\n`)
  for (const day of feed.slice(0, 14)) {
    console.log(`══ ${day.date} (${day.label}) — ${day.matches.length} matches ══`)
    for (const m of day.matches) {
      console.log(`  ${m.region}  ${m.teamA} vs ${m.teamB} — ${m.eventName} [${m.format}] via ${m.channelName}`)
    }
    console.log()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
