/**
 * Pulls the canonical roster of every team in the leagues we monitor from the
 * Leaguepedia Cargo API and emits `lib/teams.generated.ts`. The runtime never
 * hits the network — it imports from the generated file.
 *
 * Run: `npm run sync:teams`
 *
 * The API rate-limits anonymous requests aggressively (~1 req/sec). We pace
 * accordingly. A full sync makes ~10–15 requests and takes ~30–60 seconds.
 */

import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CARGO_ENDPOINT = 'https://lol.fandom.com/api.php'
const USER_AGENT = 'spoiler-shield-sync/1.0 (https://github.com/sasha-cox/spoiler-shield)'
const REQUEST_INTERVAL_MS = 6000

interface TrackedLeague {
  shortCode: string
  regionId: 'KR' | 'EU' | 'NA' | 'CN' | 'BR'
  overviewPrefix: string
}

const TRACKED_LEAGUES: TrackedLeague[] = [
  { shortCode: 'LCK',   regionId: 'KR', overviewPrefix: 'LCK/' },
  { shortCode: 'LEC',   regionId: 'EU', overviewPrefix: 'LEC/' },
  { shortCode: 'LCS',   regionId: 'NA', overviewPrefix: 'LCS/' },
  { shortCode: 'LPL',   regionId: 'CN', overviewPrefix: 'LPL/' },
  { shortCode: 'CBLOL', regionId: 'BR', overviewPrefix: 'CBLOL/' },
]

interface CargoRow<T> { title: T }

interface Tournament { OverviewPage: string; Year: string }
interface RosterRow { OverviewPage: string; Team: string }
interface TeamRow { Name: string; Short: string; OverviewPage?: string }
interface RedirectRow { AllName: string; OtherName: string }

interface CargoResponse<T> {
  cargoquery?: CargoRow<T>[]
  error?: { code: string; info: string }
}

let lastRequestAt = 0

async function paceLimit() {
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (elapsed < REQUEST_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL_MS - elapsed))
  }
  lastRequestAt = Date.now()
}

async function cargoQuery<T>(params: Record<string, string>, attempt = 0): Promise<T[]> {
  await paceLimit()
  const url = new URL(CARGO_ENDPOINT)
  url.searchParams.set('action', 'cargoquery')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '500')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const all: T[] = []
  let offset = 0
  while (true) {
    url.searchParams.set('offset', String(offset))
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    const data = (await res.json()) as CargoResponse<T>
    if (data.error) {
      if (data.error.code === 'ratelimited' && attempt < 5) {
        const backoff = 2 ** attempt * 5000
        console.warn(`  rate limited, backing off ${backoff}ms`)
        await new Promise((r) => setTimeout(r, backoff))
        return cargoQuery<T>(params, attempt + 1)
      }
      throw new Error(`Cargo error: ${data.error.code} — ${data.error.info}`)
    }
    const rows = (data.cargoquery ?? []).map((r) => r.title)
    all.push(...rows)
    if (rows.length < 500) break
    offset += 500
    await paceLimit()
  }
  return all
}

async function getCurrentSeasonTournaments(league: TrackedLeague, year: number): Promise<string[]> {
  const tournaments = await cargoQuery<Tournament>({
    tables: 'Tournaments',
    fields: 'OverviewPage,Year',
    where: `Tournaments.OverviewPage LIKE "${league.overviewPrefix}%" AND Tournaments.Year = "${year}"`,
  })
  return tournaments.map((t) => t.OverviewPage)
}

async function getTeamsForOverviewPages(overviewPages: string[]): Promise<Set<string>> {
  if (overviewPages.length === 0) return new Set()
  const escaped = overviewPages.map((p) => `"${p.replace(/"/g, '\\"')}"`).join(',')
  const rows = await cargoQuery<RosterRow>({
    tables: 'TournamentRosters',
    fields: 'OverviewPage,Team',
    where: `TournamentRosters.OverviewPage IN (${escaped})`,
  })
  const teams = new Set<string>()
  for (const row of rows) if (row.Team) teams.add(row.Team)
  return teams
}

async function getTeamMetadata(teamNames: string[]): Promise<Map<string, TeamRow>> {
  if (teamNames.length === 0) return new Map()
  const escaped = teamNames.map((n) => `"${n.replace(/"/g, '\\"')}"`).join(',')
  const rows = await cargoQuery<TeamRow>({
    tables: 'Teams',
    fields: 'Name,Short,OverviewPage',
    where: `Teams.OverviewPage IN (${escaped}) OR Teams.Name IN (${escaped})`,
  })
  const map = new Map<string, TeamRow>()
  for (const row of rows) {
    if (row.OverviewPage) map.set(row.OverviewPage, row)
    if (row.Name && !map.has(row.Name)) map.set(row.Name, row)
  }
  return map
}

async function getRedirects(canonicalNames: string[]): Promise<Map<string, Set<string>>> {
  if (canonicalNames.length === 0) return new Map()
  const escaped = canonicalNames.map((n) => `"${n.replace(/"/g, '\\"')}"`).join(',')
  const rows = await cargoQuery<RedirectRow>({
    tables: 'TeamRedirects',
    fields: 'AllName,OtherName',
    where: `TeamRedirects.OtherName IN (${escaped})`,
  })
  const aliases = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.AllName || !row.OtherName) continue
    if (!aliases.has(row.OtherName)) aliases.set(row.OtherName, new Set())
    aliases.get(row.OtherName)!.add(row.AllName)
  }
  return aliases
}

interface SyncResult {
  generatedAt: string
  TEAM_ALIASES: Record<string, string[]>
  TEAM_REGIONS: Record<string, string>
}

async function sync(): Promise<SyncResult> {
  const TEAM_ALIASES: Record<string, string[]> = {}
  const TEAM_REGIONS: Record<string, string> = {}
  const allCanonical = new Set<string>()

  // Use current year, fall back to previous year if a league has no tournaments yet
  // (happens early in a calendar year before the season starts).
  const currentYear = new Date().getFullYear()

  for (const league of TRACKED_LEAGUES) {
    process.stdout.write(`[${league.shortCode}] tournaments...`)
    let pages = await getCurrentSeasonTournaments(league, currentYear)
    let yearUsed = currentYear
    if (pages.length === 0) {
      pages = await getCurrentSeasonTournaments(league, currentYear - 1)
      yearUsed = currentYear - 1
    }
    process.stdout.write(` ${pages.length} (${yearUsed})\n`)
    if (pages.length === 0) {
      console.warn(`  no tournaments found for ${league.shortCode} — skipping`)
      continue
    }

    process.stdout.write(`[${league.shortCode}] rosters...`)
    const teams = await getTeamsForOverviewPages(pages)
    process.stdout.write(` ${teams.size} teams\n`)

    process.stdout.write(`[${league.shortCode}] team metadata...`)
    const meta = await getTeamMetadata([...teams])
    process.stdout.write(` resolved ${meta.size}\n`)

    for (const team of teams) {
      const row = meta.get(team)
      const canonical = row?.Name ?? team
      const aliases = new Set<string>([canonical, team])
      if (row?.Short) aliases.add(row.Short)
      const existing = TEAM_ALIASES[canonical] ?? []
      TEAM_ALIASES[canonical] = [...new Set([...existing, ...aliases])]
      TEAM_REGIONS[canonical] = league.regionId
      allCanonical.add(canonical)
    }
  }

  process.stdout.write(`[redirects] fetching aliases for ${allCanonical.size} teams...`)
  const redirectMap = await getRedirects([...allCanonical])
  let aliasesAdded = 0
  for (const [canonical, alts] of redirectMap.entries()) {
    const existing = new Set(TEAM_ALIASES[canonical] ?? [canonical])
    for (const alt of alts) {
      if (!existing.has(alt)) aliasesAdded++
      existing.add(alt)
    }
    TEAM_ALIASES[canonical] = [...existing]
  }
  process.stdout.write(` ${aliasesAdded} aliases\n`)

  // Sort everything for stable diffs.
  const sortedAliases: Record<string, string[]> = {}
  for (const k of Object.keys(TEAM_ALIASES).sort()) {
    sortedAliases[k] = [...TEAM_ALIASES[k]].sort()
  }
  const sortedRegions: Record<string, string> = {}
  for (const k of Object.keys(TEAM_REGIONS).sort()) {
    sortedRegions[k] = TEAM_REGIONS[k]
  }

  return {
    generatedAt: new Date().toISOString(),
    TEAM_ALIASES: sortedAliases,
    TEAM_REGIONS: sortedRegions,
  }
}

async function main() {
  console.log('Syncing team data from Leaguepedia...')
  const result = await sync()
  const teamCount = Object.keys(result.TEAM_ALIASES).length

  const banner =
    '// AUTO-GENERATED by scripts/sync-teams.ts. DO NOT EDIT.\n' +
    `// Run \`npm run sync:teams\` to regenerate.\n` +
    `// Last sync: ${result.generatedAt} (${teamCount} teams)\n\n`

  const body =
    `export const TEAMS_GENERATED_AT = ${JSON.stringify(result.generatedAt)} as const\n\n` +
    `export const TEAM_ALIASES: Record<string, string[]> = ${JSON.stringify(result.TEAM_ALIASES, null, 2)}\n\n` +
    `export const TEAM_REGIONS: Record<string, string> = ${JSON.stringify(result.TEAM_REGIONS, null, 2)}\n`

  const outPath = resolve(__dirname, '..', 'lib', 'teams.generated.ts')
  await writeFile(outPath, banner + body, 'utf8')
  console.log(`\nWrote ${teamCount} teams to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
