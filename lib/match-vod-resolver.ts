/**
 * Joins the lolesports schedule with YouTube uploads to figure out which
 * upload is the VOD for which scheduled match. The schedule is the source of
 * truth for canonical team names, league, and format — upload titles are
 * unreliable (player names, hype lines, multiple "vs" pairs).
 *
 * Resolution rules per upload:
 *   1. Pick a candidate league via league code in title (LCK/LEC/LCS/LPL/CBLOL)
 *      OR the channel's league hint when title is bare.
 *   2. Look at scheduled matches in that league whose startTime is within
 *      [-1h, +36h] of the upload's publishedAt.
 *   3. From that narrowed set, find the unique match where BOTH team aliases
 *      (canonical name OR code) appear in the title. If exactly one match
 *      satisfies that, attach the upload there. Otherwise, drop the upload —
 *      better to omit than display the wrong matchup.
 */

import { leagueSlugFromTitle } from './leagues'
import { channelByName, channelPriority } from './config'
import {
  NON_FULL_MATCH_TITLE,
  UPLOAD_WINDOW_BEFORE_MS,
  UPLOAD_WINDOW_AFTER_MS,
} from './constants'
import type { ScheduledMatch } from './lolesports'
import type { RawUpload } from './feed-utils'

export interface VodCandidate {
  upload: RawUpload
  channelPriority: number
}

function leagueHintForUpload(upload: RawUpload): string | null {
  const fromTitle = leagueSlugFromTitle(upload.title)
  if (fromTitle) return fromTitle
  return channelByName(upload.channelName)?.leagueSlug ?? null
}

function teamMatchesInTitle(team: ScheduledMatch['teamA'], title: string): boolean {
  const upper = title.toUpperCase()
  const code = team.code.toUpperCase()
  const name = team.name.toUpperCase()
  // Match by code as a whole word (avoid "G2" matching "G2C" or "AG2X").
  const codeRegex = new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
  if (codeRegex.test(upper)) return true
  // Match by full name substring (canonical names are long enough that false
  // positives are rare).
  if (name.length >= 4 && upper.includes(name)) return true
  return false
}

function findScheduledMatchForUpload(
  upload: RawUpload,
  schedule: ScheduledMatch[],
): ScheduledMatch | null {
  const leagueSlug = leagueHintForUpload(upload)
  if (!leagueSlug) return null

  const uploadTime = upload.publishedAt.getTime()
  const candidates = schedule.filter((m) => {
    if (m.leagueSlug !== leagueSlug) return false
    const matchTime = Date.parse(m.startTime)
    if (!Number.isFinite(matchTime)) return false
    const delta = uploadTime - matchTime
    return delta >= -UPLOAD_WINDOW_BEFORE_MS && delta <= UPLOAD_WINDOW_AFTER_MS
  })

  if (candidates.length === 0) return null

  const matchHits = candidates.filter(
    (m) => teamMatchesInTitle(m.teamA, upload.title) && teamMatchesInTitle(m.teamB, upload.title),
  )

  if (matchHits.length === 1) return matchHits[0]
  // Ambiguous: don't guess.
  return null
}

export interface ResolveResult {
  /** Map of scheduled-match ID → best VOD candidate found. */
  byMatchId: Map<string, VodCandidate>
  /** Uploads that passed the spoiler-safe content filter but didn't match any
   *  scheduled match. Candidates for the unofficial-resolver pass. */
  orphans: RawUpload[]
}

/**
 * For each scheduled match, attaches the best-priority VOD candidate found.
 * Uploads with non-full-match titles (highlights, recaps, shorts) are
 * dropped entirely. Uploads that pass content filtering but don't match
 * any scheduled match are returned as `orphans` for downstream processing.
 */
export function resolveVodsForSchedule(
  schedule: ScheduledMatch[],
  uploads: RawUpload[],
): ResolveResult {
  const byMatchId = new Map<string, VodCandidate>()
  const orphans: RawUpload[] = []
  for (const upload of uploads) {
    if (NON_FULL_MATCH_TITLE.test(upload.title)) continue
    const match = findScheduledMatchForUpload(upload, schedule)
    if (!match) {
      orphans.push(upload)
      continue
    }
    const priority = channelPriority(upload.channelName)
    const existing = byMatchId.get(match.id)
    if (!existing || priority < existing.channelPriority) {
      byMatchId.set(match.id, { upload, channelPriority: priority })
    }
  }
  return { byMatchId, orphans }
}
