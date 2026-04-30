/**
 * Resolves YouTube uploads that didn't match any lolesports-scheduled match
 * into "unofficial" feed entries. These are showmatches, creator tournaments,
 * Watch Party Tour clashes, etc. — events Riot doesn't index.
 *
 * Guardrails (strict — better to drop than to mis-label):
 *   1. Title must contain exactly one "vs" pair.
 *   2. Both sides of that pair must resolve to a known canonical team via
 *      the alias map (no naked player names, no unknown community teams).
 *   3. The two resolved teams must be different.
 *   4. The title must not contain any "non full match" markers (highlights,
 *      recaps, shorts) — those were filtered upstream but we re-check here.
 *
 * Anything ambiguous gets dropped on the floor. Same discipline as the
 * scheduled resolver — refusing to guess is the policy.
 */

import { TEAM_ALIASES, normalizeTeamName } from './team-aliases'
import { TEAM_REGIONS } from './teams.generated'
import { REGIONS, type Region } from './regions'
import { channelPriority } from './config'
import type { RawUpload } from './feed-utils'
import type { FeedMatch } from './types'

const NON_FULL_MATCH_TITLE = /\bhighlights\b|\brecap\b|\bpreview\b|\breaction\b|\bbest of\b|\bcompilation\b|\bmontage\b|#shorts\b|press conference|tier ?list/i

const VS_SPLIT = /\s+(?:vs\.?|VS\.?)\s+/i

interface AliasHit {
  canonical: string
  alias: string
  index: number
}

function findAllAliasHits(text: string): AliasHit[] {
  const hits: AliasHit[] = []
  const upper = text.toUpperCase()
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      const aliasUpper = alias.toUpperCase()
      if (aliasUpper.length < 2) continue
      const re = new RegExp(`\\b${aliasUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
      const m = upper.match(re)
      if (m && m.index !== undefined) {
        hits.push({ canonical, alias, index: m.index })
      }
    }
  }
  return hits
}

interface ParsedUnofficial {
  teamA: string
  teamB: string
  /** Best human-readable event name we can reconstruct from the title. */
  eventName: string
}

function parseUnofficialTitle(title: string): ParsedUnofficial | null {
  if (NON_FULL_MATCH_TITLE.test(title)) return null

  // Step 1: must be exactly one "vs" — multi-vs titles ("ZEUS vs KINGEN | HLE
  // vs NS") are exactly the case the schedule resolver protects against.
  const vsMatches = title.match(/\b(vs\.?|VS\.?)\b/gi)
  if (!vsMatches || vsMatches.length !== 1) return null

  // Step 2: collect alias hits across the whole title; both sides of the
  // split must contain at least one canonical team, and the two canonicals
  // must differ.
  const [leftRaw, rightRaw] = title.split(VS_SPLIT)
  if (!leftRaw || !rightRaw) return null

  const leftHits = findAllAliasHits(leftRaw)
  const rightHits = findAllAliasHits(rightRaw)
  if (leftHits.length === 0 || rightHits.length === 0) return null

  // Pick the rightmost hit on the left and leftmost on the right — those are
  // the team tokens flanking "vs".
  const teamA = leftHits.reduce((best, h) => (h.index > best.index ? h : best)).canonical
  const teamB = rightHits.reduce((best, h) => (h.index < best.index ? h : best)).canonical
  if (teamA === teamB) return null

  // Build a clean event name: drop the "TeamA vs TeamB" portion so we just
  // get whatever context the title had, falling back to "Unofficial".
  const cleaned = title
    .replace(/[A-Za-z0-9 .]+\s+(?:vs\.?|VS\.?)\s+[A-Za-z0-9 .]+(?:\s*[-–—|]|$)/, '')
    .replace(/^[\s|—–-]+|[\s|—–-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    teamA,
    teamB,
    eventName: cleaned.length >= 4 ? cleaned : 'Unofficial event',
  }
}

function regionForUnofficial(teamA: string, teamB: string): Region {
  const ra = TEAM_REGIONS[teamA]
  const rb = TEAM_REGIONS[teamB]
  if (ra && rb && ra === rb) return REGIONS[ra] ?? REGIONS.INT
  return REGIONS.INT
}

/**
 * Builds unofficial FeedMatch entries from orphan uploads. Dedupes the same
 * canonical (teamA, teamB, date) pairing across channels via channel priority.
 */
export function buildUnofficialMatches(orphans: RawUpload[]): FeedMatch[] {
  const seen = new Map<string, { match: FeedMatch; channelPriority: number }>()

  for (const upload of orphans) {
    const parsed = parseUnofficialTitle(upload.title)
    if (!parsed) continue

    // Confirm both teams resolved are real (defensive — parseUnofficialTitle
    // already routes through the alias map, but normalizeTeamName is a clean
    // sanity check).
    if (!normalizeTeamName(parsed.teamA) && !TEAM_REGIONS[parsed.teamA]) continue
    if (!normalizeTeamName(parsed.teamB) && !TEAM_REGIONS[parsed.teamB]) continue

    const date = upload.publishedAt.toISOString().slice(0, 10)
    const dedupKey = [parsed.teamA, parsed.teamB].sort().join('|') + '|' + date
    const region = regionForUnofficial(parsed.teamA, parsed.teamB)
    const priority = channelPriority(upload.channelName)

    const candidate: FeedMatch = {
      id: `unofficial:${upload.videoId}`,
      kind: 'unofficial',
      teamA: parsed.teamA,
      teamB: parsed.teamB,
      eventName: parsed.eventName,
      format: 'bo1',
      youtubeVideoId: upload.videoId,
      channelName: upload.channelName,
      watched: false,
      publishedAt: upload.publishedAt.toISOString(),
      region: region.shortCode,
      regionFlag: region.flag,
      regionColor: region.color,
    }

    const existing = seen.get(dedupKey)
    if (!existing || priority < existing.channelPriority) {
      seen.set(dedupKey, { match: candidate, channelPriority: priority })
    }
  }

  return [...seen.values()].map((e) => e.match)
}
