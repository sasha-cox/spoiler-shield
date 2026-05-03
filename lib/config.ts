/**
 * The set of YouTube channels we poll for VOD candidates. Each entry needs:
 *   - a stable channel ID (the `UC...` form)
 *   - a display name shown on cards
 *   - a `priority` (lower = preferred when multiple channels cover the same
 *     scheduled match — co-streamers > official leagues > LoL Esports)
 *   - an optional `leagueSlug` hint used by the resolver when a title is
 *     bare (e.g. an LCK upload titled just "what a series" still resolves)
 *
 * Channel IDs come from `youtube.com/channel/UC.../videos` (use the URL form
 * — handles like @LCK aren't usable directly). Run `pnpm verify:connectors`
 * to confirm every entry resolves.
 */

import type { LeagueConfig } from './leagues'

export interface MonitoredChannel {
  name: string
  youtubeChannelId: string
  /** lolesports league slug (e.g. "lck") used as a fallback hint when the
   *  upload title doesn't mention a league. Co-streamers cover many leagues
   *  so they leave this undefined. */
  leagueSlug?: LeagueConfig['slug']
  /** Lower = preferred during dedup. Co-streamers 0, official leagues 1,
   *  global aggregators 2. */
  priority: number
}

export const MONITORED_CHANNELS: MonitoredChannel[] = [
  // Co-streamers — preferred when present
  { name: 'Caedrel',     youtubeChannelId: 'UCOFiUtKui6-x4T-J7_DgCag', priority: 0 },
  { name: 'IWDominate',  youtubeChannelId: 'UCb5fmS26ENzQqGuQ7jLaMEg', priority: 0 },
  { name: 'LS',          youtubeChannelId: 'UCuOqvRRt9GqyIUVTwSB4Ucg', priority: 0 },
  // Official leagues
  { name: 'LCK',         youtubeChannelId: 'UCw1DsweY9b2AKGjV4kGJP1A', leagueSlug: 'lck',          priority: 1 },
  { name: 'LEC',         youtubeChannelId: 'UCWWZjhmokTbezUQr1kbbEYQ', leagueSlug: 'lec',          priority: 1 },
  { name: 'LCS',         youtubeChannelId: 'UCSF_aFGIIIoWY30GVV19TKA', leagueSlug: 'lcs',          priority: 1 },
  { name: 'CBLOL',       youtubeChannelId: 'UC48rkTlXjRd6pnqqBkdV0Mw', leagueSlug: 'cblol-brazil', priority: 1 },
  // Global
  { name: 'LoL Esports', youtubeChannelId: 'UCvqRdlKsE5Q8mf8YXbdIJLw', priority: 2 },
]

const byName = new Map(MONITORED_CHANNELS.map((c) => [c.name, c]))
export function channelByName(name: string): MonitoredChannel | undefined {
  return byName.get(name)
}

export function channelPriority(name: string): number {
  return byName.get(name)?.priority ?? 99
}
