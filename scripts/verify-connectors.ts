/**
 * Pings every external API + content source the app relies on and reports
 * pass/fail. Run before/after touching connector code or config.
 *
 *   pnpm verify:connectors
 *
 * Exits non-zero on any failure so you can wire it into CI.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MONITORED_CHANNELS } from '../lib/config.js'
import { LEAGUES } from '../lib/leagues.js'
import { getUploadsPlaylistId } from '../lib/youtube.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
function getEnv(key: string): string | undefined {
  return envFile
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${key}=`))
    ?.slice(key.length + 1)
}

const youtubeKey = getEnv('YOUTUBE_API_KEY')
const lolesportsKey = getEnv('LOLESPORTS_API_KEY') || '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

let failures = 0

function pass(label: string, detail = '') {
  console.log(`  ${'✓'} ${label}${detail ? '  ' + detail : ''}`)
}
function fail(label: string, detail = '') {
  failures++
  console.log(`  ${'✗'} ${label}${detail ? '  ' + detail : ''}`)
}

async function checkYoutube() {
  console.log('\nYouTube Data API v3:')
  if (!youtubeKey) {
    fail('YOUTUBE_API_KEY is not set')
    return
  }
  for (const channel of MONITORED_CHANNELS) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('playlistId', getUploadsPlaylistId(channel.youtubeChannelId))
    url.searchParams.set('maxResults', '1')
    url.searchParams.set('key', youtubeKey)
    try {
      const res = await fetch(url.toString())
      if (!res.ok) {
        fail(channel.name, `${res.status} for ${channel.youtubeChannelId}`)
        continue
      }
      const data = await res.json()
      const sample = data.items?.[0]?.snippet?.title?.slice(0, 60) ?? '(no items)'
      pass(channel.name, `latest: ${sample}`)
    } catch (e) {
      fail(channel.name, String(e))
    }
  }
}

async function checkLolesports() {
  console.log('\nlolesports.com schedule API:')
  for (const league of LEAGUES) {
    const url = new URL('https://esports-api.lolesports.com/persisted/gw/getSchedule')
    url.searchParams.set('hl', 'en-US')
    url.searchParams.set('leagueId', league.lolesportsId)
    try {
      const res = await fetch(url, { headers: { 'x-api-key': lolesportsKey } })
      if (!res.ok) {
        fail(league.slug, `${res.status} for league ${league.lolesportsId}`)
        continue
      }
      const data = await res.json()
      const events = data?.data?.schedule?.events ?? []
      pass(league.slug, `${events.length} scheduled events`)
    } catch (e) {
      fail(league.slug, String(e))
    }
  }
}

async function checkLeaguepedia() {
  // Build-time only — used by `pnpm sync:teams` to refresh teams.generated.ts.
  // Rate-limit responses are common (Fandom is aggressive with anonymous
  // queries) and don't break the runtime app, so we warn instead of fail.
  console.log('\nLeaguepedia Cargo API (build-time only — used by sync:teams):')
  const url = 'https://lol.fandom.com/api.php?action=cargoquery&format=json&tables=Teams&fields=Name&where=Region%3D%22Korea%22&limit=1'
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'spoiler-shield-verify/1.0' } })
    if (!res.ok) { console.log(`  ⚠ cargoquery probe  HTTP ${res.status} (non-fatal)`); return }
    const data = await res.json()
    if (data.error) {
      console.log(`  ⚠ cargoquery probe  ${data.error.code} (non-fatal — try again later or run sync:teams from another IP)`)
      return
    }
    pass('cargoquery probe', `returned ${(data.cargoquery ?? []).length} rows`)
  } catch (e) {
    console.log(`  ⚠ cargoquery probe  ${e} (non-fatal)`)
  }
}

async function main() {
  await checkYoutube()
  await checkLolesports()
  await checkLeaguepedia()
  console.log()
  if (failures > 0) {
    console.error(`${failures} failure${failures === 1 ? '' : 's'}.`)
    process.exit(1)
  }
  console.log('All connectors healthy.')
}

main().catch((e) => { console.error(e); process.exit(1) })
