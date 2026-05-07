/**
 * Single source of truth for cross-cutting constants — TTLs, time windows,
 * regexes used in more than one place. If a value lives here, treat it as
 * a policy decision; don't override it inline elsewhere.
 */

// ── Cache TTLs ─────────────────────────────────────────────────
/** lolesports.com schedule cache (in-memory, server-side). */
export const SCHEDULE_CACHE_TTL_MS = 30 * 60 * 1000
/** /api/feed response cache (in-memory, server-side). Keep in sync with
 *  FEED_REVALIDATE_SECONDS — Next.js needs a literal number for the page
 *  route's `export const revalidate`, so we can't derive one from the other. */
export const FEED_CACHE_TTL_MS = 180 * 1000
export const FEED_REVALIDATE_SECONDS = 180

// ── Pipeline windows ───────────────────────────────────────────
/** How many days of YouTube uploads we fetch per channel. Bigger = more
 *  coverage of slow-moving channels at the cost of API quota. */
export const UPLOADS_LOOKBACK_DAYS = 21
/** How many days of scheduled matches we fetch from lolesports. Slightly
 *  wider than uploads to allow for late-uploaded VODs near the cutoff. */
export const SCHEDULE_LOOKBACK_DAYS = 28
/** Window (relative to a scheduled match's startTime) within which an
 *  upload may be attached as that match's VOD. */
export const UPLOAD_WINDOW_BEFORE_MS = 60 * 60 * 1000      // 1 hour pre-start
export const UPLOAD_WINDOW_AFTER_MS  = 36 * 60 * 60 * 1000 // 36 hours post-start
/** When folding unofficial entries in, suppress any whose matchup already
 *  appears in the official feed within +/- this many days. */
export const UNOFFICIAL_DEDUPE_WINDOW_DAYS = 3

// ── Content filtering ─────────────────────────────────────────
/**
 * Rejects uploads that aren't full-match content. Both resolvers (the
 * schedule join and the unofficial fallback) use this to avoid attaching
 * a HIGHLIGHTS / recap / shorts video as a match VOD — the YouTube embed
 * surfaces the title inside the player, so a "highlights" title bleeds the
 * result through.
 *
 * If you add a new keyword, both resolvers pick it up automatically.
 */
export const NON_FULL_MATCH_TITLE = /\bhighlights\b|\brecap\b|\bpreview\b|\breact(?:s|ion|ing)?\b|\bbest of\b|\bcompilation\b|\bmontage\b|#shorts\b|press conference|tier ?list|\bvods? ?recap\b|\bdocumentary\b|\bdocu\b|\binterview\b|\banalysis\b|\bbreakdown\b/i

// ── Rate limiting (/api/feed) ──────────────────────────────────
export const RATE_LIMIT_WINDOW_MS = 60 * 1000
export const RATE_LIMIT_MAX = 20
