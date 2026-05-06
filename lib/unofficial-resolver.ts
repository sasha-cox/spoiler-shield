/**
 * Resolves YouTube uploads that didn't match any lolesports-scheduled match
 * into "unofficial" feed entries. These are showmatches, creator tournaments,
 * Watch Party Tour clashes, etc. — events Riot doesn't index.
 *
 * Guardrails (strict — better to drop than to mis-label):
 *   1. Title must contain exactly one "vs" pair.
 *   2. Both sides of that pair must resolve to a known team via the
 *      registry (alias, code, or canonical name match).
 *   3. The two resolved teams must be different.
 *   4. The title must not contain any "non full match" markers (highlights,
 *      recaps, shorts) — those were filtered upstream but we re-check here
 *      using the shared NON_FULL_MATCH_TITLE constant.
 */

import { REGIONS, type Region } from './regions'
import { channelPriority } from './config'
import { findTeam, type BuiltRegistryShape } from './team-registry'
import { NON_FULL_MATCH_TITLE } from './constants'
import type { RawUpload } from './feed-utils'
import type { FeedMatch } from './types'

const VS_SPLIT = /\s+(?:vs\.?|VS\.?)\s+/i
const VS_COUNT = /\b(vs\.?|VS\.?)\b/gi

interface ParsedUnofficial {
  teamA: string
  teamB: string
  /** Best human-readable event name we can reconstruct from the title. */
  eventName: string
}

/**
 * Walks the registry's alias index against the given side of a "vs" split,
 * returns the canonical name of the team that appears furthest to the
 * inside (closest to the "vs" token). Returns null if no team is found.
 */
function findTeamInSide(
  registry: BuiltRegistryShape,
  text: string,
  side: 'left' | 'right',
): string | null {
  const upper = text.toUpperCase()
  let bestCanonical: string | null = null
  let bestIndex = side === 'left' ? -1 : Number.MAX_SAFE_INTEGER

  for (const [aliasLower, canonical] of registry.byAlias.entries()) {
    if (aliasLower.length < 2) continue
    const aliasUpper = aliasLower.toUpperCase()
    const escaped = aliasUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}\\b`)
    const m = upper.match(re)
    if (!m || m.index === undefined) continue
    if (side === 'left' ? m.index > bestIndex : m.index < bestIndex) {
      bestIndex = m.index
      bestCanonical = canonical
    }
  }
  return bestCanonical
}

function parseUnofficialTitle(
  registry: BuiltRegistryShape,
  title: string,
): ParsedUnofficial | null {
  if (NON_FULL_MATCH_TITLE.test(title)) return null

  const vsMatches = title.match(VS_COUNT)
  if (!vsMatches || vsMatches.length !== 1) return null

  const [leftRaw, rightRaw] = title.split(VS_SPLIT)
  if (!leftRaw || !rightRaw) return null

  const teamA = findTeamInSide(registry, leftRaw, 'left')
  const teamB = findTeamInSide(registry, rightRaw, 'right')
  if (!teamA || !teamB || teamA === teamB) return null

  // Reconstruct an event name by stripping the "TeamA vs TeamB" portion.
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

function regionForUnofficial(registry: BuiltRegistryShape, teamA: string, teamB: string): Region {
  const ra = findTeam(registry, teamA)?.regionId
  const rb = findTeam(registry, teamB)?.regionId
  if (ra && rb && ra === rb) return REGIONS[ra] ?? REGIONS.INT
  return REGIONS.INT
}

/**
 * Builds unofficial FeedMatch entries from orphan uploads. Dedupes the same
 * canonical (teamA, teamB, date) pairing across channels via channel priority.
 */
export function buildUnofficialMatches(
  orphans: RawUpload[],
  registry: BuiltRegistryShape,
): FeedMatch[] {
  const seen = new Map<string, { match: FeedMatch; channelPriority: number }>()

  for (const upload of orphans) {
    const parsed = parseUnofficialTitle(registry, upload.title)
    if (!parsed) continue

    const date = upload.publishedAt.toISOString().slice(0, 10)
    const dedupKey = [parsed.teamA, parsed.teamB].sort().join('|') + '|' + date
    const region = regionForUnofficial(registry, parsed.teamA, parsed.teamB)
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
      region: region.id,
      regionLabel: region.label,
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
