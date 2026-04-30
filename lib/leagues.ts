/**
 * Single source of truth for the leagues we track on lolesports.com.
 *
 * Adding a league = one row here. The schedule client, the title-hint
 * resolver, and the region mapper all derive their configuration from this
 * table, so they cannot drift out of sync.
 */

export type RegionId = 'KR' | 'EU' | 'NA' | 'CN' | 'BR' | 'INT'

export interface LeagueConfig {
  /** lolesports league slug (e.g. "lck") — also used as the canonical key */
  slug: string
  /** lolesports numeric league ID — the only thing the API actually keys on */
  lolesportsId: string
  /** Human-readable display name */
  name: string
  /** Region id from lib/regions.ts. International events bucket as 'INT'. */
  regionId: RegionId
  /** Tokens that, if any appear in a YouTube title (case-insensitive,
   *  word-bounded), let the resolver guess this league. The first entry is
   *  the canonical short code shown in the UI. */
  titleHints: string[]
}

export const LEAGUES: LeagueConfig[] = [
  // Tier-1
  { slug: 'lck',          lolesportsId: '98767991310872058',  name: 'LCK',          regionId: 'KR', titleHints: ['LCK'] },
  { slug: 'lec',          lolesportsId: '98767991302996019',  name: 'LEC',          regionId: 'EU', titleHints: ['LEC'] },
  { slug: 'lcs',          lolesportsId: '98767991299243165',  name: 'LCS',          regionId: 'NA', titleHints: ['LCS'] },
  { slug: 'lpl',          lolesportsId: '98767991314006698',  name: 'LPL',          regionId: 'CN', titleHints: ['LPL'] },
  { slug: 'cblol-brazil', lolesportsId: '98767991332355509',  name: 'CBLOL',        regionId: 'BR', titleHints: ['CBLOL'] },
  { slug: 'lcp',          lolesportsId: '113476371197627891', name: 'LCP',          regionId: 'INT', titleHints: ['LCP'] },
  // Tier-2
  { slug: 'nlc',                    lolesportsId: '105266098308571975', name: 'NLC',              regionId: 'EU',  titleHints: ['NLC'] },
  { slug: 'lfl',                    lolesportsId: '105266103462388553', name: 'LFL',              regionId: 'EU',  titleHints: ['LFL'] },
  { slug: 'primeleague',            lolesportsId: '105266091639104326', name: 'Prime League',     regionId: 'EU',  titleHints: ['Prime League', 'PRM'] },
  { slug: 'hitpoint_masters',       lolesportsId: '105266106309666619', name: 'Hitpoint Masters', regionId: 'EU',  titleHints: ['Hitpoint'] },
  { slug: 'lck_challengers_league', lolesportsId: '98767991335774713',  name: 'LCK Challengers',  regionId: 'KR',  titleHints: ['LCK Challengers', 'LCKC'] },
  { slug: 'nacl',                   lolesportsId: '109511549831443335', name: 'NACL',             regionId: 'NA',  titleHints: ['NACL'] },
  { slug: 'cd',                     lolesportsId: '105549980953490846', name: 'CD',               regionId: 'BR',  titleHints: ['Circuito Desafiante', 'CD'] },
  { slug: 'ljl-japan',              lolesportsId: '98767991349978712',  name: 'LJL',              regionId: 'INT', titleHints: ['LJL'] },
  { slug: 'vcs',                    lolesportsId: '107213827295848783', name: 'VCS',              regionId: 'INT', titleHints: ['VCS'] },
  // International
  { slug: 'worlds',       lolesportsId: '98767975604431411',  name: 'Worlds',       regionId: 'INT', titleHints: ['Worlds'] },
  { slug: 'msi',          lolesportsId: '98767991325878492',  name: 'MSI',          regionId: 'INT', titleHints: ['MSI'] },
  { slug: 'first_stand',  lolesportsId: '113464388705111224', name: 'First Stand',  regionId: 'INT', titleHints: ['First Stand'] },
  { slug: 'emea_masters', lolesportsId: '100695891328981122', name: 'EMEA Masters', regionId: 'INT', titleHints: ['EMEA Masters', 'EM'] },
  { slug: 'americas_cup', lolesportsId: '116096325848746167', name: 'Americas Cup', regionId: 'INT', titleHints: ['Americas Cup'] },
]

const bySlug = new Map(LEAGUES.map((l) => [l.slug, l]))
export function leagueBySlug(slug: string): LeagueConfig | undefined {
  return bySlug.get(slug)
}

/**
 * Compiled regex that detects which league a YouTube title is talking about.
 * Tokens longer than 4 chars (e.g. "Prime League") are matched as a literal
 * substring; short tokens like "LCK" are matched with word boundaries to
 * avoid catching "LCKC" or "tlcks". Returns the league slug or null.
 */
const HINT_INDEX: Array<{ pattern: RegExp; slug: string }> = LEAGUES.flatMap((league) =>
  league.titleHints.map((hint) => {
    const escaped = hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = hint.length <= 4 ? new RegExp(`\\b${escaped}\\b`, 'i') : new RegExp(escaped, 'i')
    return { pattern, slug: league.slug }
  }),
)

export function leagueSlugFromTitle(title: string): string | null {
  for (const { pattern, slug } of HINT_INDEX) {
    if (pattern.test(title)) return slug
  }
  return null
}
