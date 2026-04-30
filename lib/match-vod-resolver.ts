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

import type { ScheduledMatch } from './lolesports'
import type { RawUpload } from './feed-utils'

export interface VodCandidate {
  upload: RawUpload
  channelPriority: number
}

const LEAGUE_HINT_FROM_TITLE = /\b(LCK|LEC|LCS|LPL|CBLOL)\b/i
const LEAGUE_NAME_TO_SLUG: Record<string, string> = {
  LCK: 'lck',
  LEC: 'lec',
  LCS: 'lcs',
  LPL: 'lpl',
  CBLOL: 'cblol-brazil',
}

const CHANNEL_LEAGUE_HINT: Record<string, string> = {
  LCK: 'lck',
  LEC: 'lec',
  LCS: 'lcs',
  LPL: 'lpl',
  CBLOL: 'cblol-brazil',
}

const CHANNEL_PRIORITY: Record<string, number> = {
  Caedrel: 0,
  IWDominate: 0,
  LS: 0,
  LCK: 1,
  LEC: 1,
  LCS: 1,
  LPL: 1,
  CBLOL: 1,
  'LoL Esports': 2,
}

const UPLOAD_WINDOW_BEFORE_MS = 60 * 60 * 1000          // 1 hour pre-start
const UPLOAD_WINDOW_AFTER_MS = 36 * 60 * 60 * 1000      // 36 hours after

// Reject uploads whose titles flag them as not-the-full-match content. The
// schedule join would otherwise happily attach a HIGHLIGHTS or recap video to
// a real scheduled match, and that video's YouTube title (visible inside the
// embed) would spoil the result.
const NON_FULL_MATCH_TITLE = /\bhighlights\b|\brecap\b|\bpreview\b|\breaction\b|\bbest of\b|\bcompilation\b|\bmontage\b|\b#shorts\b|press conference|tier ?list/i

function leagueHintForUpload(upload: RawUpload): string | null {
  const m = upload.title.match(LEAGUE_HINT_FROM_TITLE)
  if (m) return LEAGUE_NAME_TO_SLUG[m[1].toUpperCase()] ?? null
  return CHANNEL_LEAGUE_HINT[upload.channelName] ?? null
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
    const priority = CHANNEL_PRIORITY[upload.channelName] ?? 99
    const existing = byMatchId.get(match.id)
    if (!existing || priority < existing.channelPriority) {
      byMatchId.set(match.id, { upload, channelPriority: priority })
    }
  }
  return { byMatchId, orphans }
}
