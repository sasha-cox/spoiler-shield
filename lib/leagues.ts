/**
 * Single source of truth for the leagues we *want* to track on lolesports.com.
 *
 * What's hardcoded here: slug + display config (name, region, title hints).
 * Slugs are the stable URL identifiers Riot publishes (`lolesports.com/lec`)
 * and effectively never change.
 *
 * What's NOT hardcoded: the numeric `lolesportsId` Riot's API actually
 * keys on. Those get resolved at runtime from `getLeagues` (see
 * `lib/lolesports.ts → resolveLeagueIds`). If Riot rotates an ID, the
 * pipeline picks it up automatically without a code change.
 *
 * Adding a league = one row here. Removing one = delete the row.
 */

export type RegionId = 'KR' | 'EU' | 'NA' | 'CN' | 'BR' | 'INT'

export interface LeagueConfig {
  /** lolesports league slug (e.g. "lck") — stable identifier from
   *  lolesports.com URLs. The runtime ID is resolved from this. */
  slug: string
  /** Human-readable display name. */
  name: string
  /** Region id from lib/regions.ts. International events bucket as 'INT'. */
  regionId: RegionId
  /** Tokens that, if any appear in a YouTube title (case-insensitive,
   *  word-bounded), let the resolver guess this league. */
  titleHints: string[]
}

export const LEAGUES: LeagueConfig[] = [
  // Tier-1
  { slug: 'lck',          name: 'LCK',          regionId: 'KR',  titleHints: ['LCK'] },
  { slug: 'lec',          name: 'LEC',          regionId: 'EU',  titleHints: ['LEC'] },
  { slug: 'lcs',          name: 'LCS',          regionId: 'NA',  titleHints: ['LCS'] },
  { slug: 'lpl',          name: 'LPL',          regionId: 'CN',  titleHints: ['LPL'] },
  { slug: 'cblol-brazil', name: 'CBLOL',        regionId: 'BR',  titleHints: ['CBLOL'] },
  { slug: 'lcp',          name: 'LCP',          regionId: 'INT', titleHints: ['LCP'] },
  // Tier-2
  { slug: 'nlc',                    name: 'NLC',              regionId: 'EU',  titleHints: ['NLC'] },
  { slug: 'lfl',                    name: 'LFL',              regionId: 'EU',  titleHints: ['LFL'] },
  { slug: 'primeleague',            name: 'Prime League',     regionId: 'EU',  titleHints: ['Prime League', 'PRM'] },
  { slug: 'hitpoint_masters',       name: 'Hitpoint Masters', regionId: 'EU',  titleHints: ['Hitpoint'] },
  { slug: 'lck_challengers_league', name: 'LCK Challengers',  regionId: 'KR',  titleHints: ['LCK Challengers', 'LCKC'] },
  { slug: 'nacl',                   name: 'NACL',             regionId: 'NA',  titleHints: ['NACL'] },
  { slug: 'cd',                     name: 'CD',               regionId: 'BR',  titleHints: ['Circuito Desafiante', 'CD'] },
  { slug: 'ljl-japan',              name: 'LJL',              regionId: 'INT', titleHints: ['LJL'] },
  { slug: 'vcs',                    name: 'VCS',              regionId: 'INT', titleHints: ['VCS'] },
  // International
  { slug: 'worlds',       name: 'Worlds',       regionId: 'INT', titleHints: ['Worlds'] },
  { slug: 'msi',          name: 'MSI',          regionId: 'INT', titleHints: ['MSI'] },
  { slug: 'first_stand',  name: 'First Stand',  regionId: 'INT', titleHints: ['First Stand'] },
  { slug: 'emea_masters', name: 'EMEA Masters', regionId: 'INT', titleHints: ['EMEA Masters', 'EM'] },
  { slug: 'americas_cup', name: 'Americas Cup', regionId: 'INT', titleHints: ['Americas Cup'] },
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
