/**
 * The set of YouTube channels we poll for VOD candidates.
 *
 * Channels are grouped by `brand` — the user-facing identity (e.g. "Caedrel").
 * Multiple underlying YouTube channels can share a brand: Caedrel posts
 * full-match VODs to @Caedrel but also to @CaedrelLive (livestream replays)
 * and other sub-channels, and which sub-channel a given match lands on is
 * itself a spoiler signal ("if it's not on the main channel, the game
 * wasn't hype"). The pipeline rolls all channels for a brand into one bucket
 * and the UI only ever shows the brand name.
 *
 *   - Polling: every entry's `youtubeChannelId` is fetched independently.
 *   - Display: only the `brand` ever surfaces to the user.
 *   - Dedup: when two uploads from the same brand resolve to the same
 *     scheduled match, channel `priority` breaks the tie.
 *
 * Each entry needs:
 *   - `name`: a unique identifier internal to this list (debug + connector
 *     verify). Pick whatever's recognisable — usually the YouTube handle.
 *   - `brand`: the user-facing name. Keep consistent across an entire brand
 *     family.
 *   - `youtubeChannelId`: the `UC...` form from `youtube.com/channel/UC...`.
 *   - `priority`: lower wins. Co-streamers 0, official leagues 1, global
 *     aggregators 2.
 *   - `leagueSlug`: optional fallback hint when an upload title is bare and
 *     the channel only ever covers one league (e.g. the official LCK
 *     channel).
 *
 * Run `pnpm verify:connectors` to confirm every entry resolves.
 */

import type { LeagueConfig } from './leagues'

export interface MonitoredChannel {
  name: string
  brand: string
  youtubeChannelId: string
  leagueSlug?: LeagueConfig['slug']
  priority: number
}

export const MONITORED_CHANNELS: MonitoredChannel[] = [
  // Co-streamer brand: Caedrel — every match Gaven cares about, regardless
  // of which sub-channel ends up hosting the VOD.
  { name: 'Caedrel',        brand: 'Caedrel',     youtubeChannelId: 'UCOFiUtKui6-x4T-J7_DgCag', priority: 0 },
  { name: 'CaedrelClips',   brand: 'Caedrel',     youtubeChannelId: 'UCU9Vd2lRheyB374OjW7iVJg', priority: 1 },
  // Caedrel's @CaedrelLive and @CaedrelReacts handles exist but have no
  // API-accessible uploads (their auto-generated `UU...` playlists 404).
  // Add them here if they ever start carrying full-match content.

  // Other co-streamer brands
  { name: 'IWDominate',     brand: 'IWDominate',  youtubeChannelId: 'UCb5fmS26ENzQqGuQ7jLaMEg', priority: 0 },
  { name: 'LS',             brand: 'LS',          youtubeChannelId: 'UCuOqvRRt9GqyIUVTwSB4Ucg', priority: 0 },

  // Official league channels
  { name: 'LCK',            brand: 'LCK',         youtubeChannelId: 'UCw1DsweY9b2AKGjV4kGJP1A', leagueSlug: 'lck',          priority: 1 },
  { name: 'LEC',            brand: 'LEC',         youtubeChannelId: 'UCWWZjhmokTbezUQr1kbbEYQ', leagueSlug: 'lec',          priority: 1 },
  { name: 'LCS',            brand: 'LCS',         youtubeChannelId: 'UCSF_aFGIIIoWY30GVV19TKA', leagueSlug: 'lcs',          priority: 1 },
  { name: 'CBLOL',          brand: 'CBLOL',       youtubeChannelId: 'UC48rkTlXjRd6pnqqBkdV0Mw', leagueSlug: 'cblol-brazil', priority: 1 },

  // Global / aggregator
  { name: 'LoL Esports',    brand: 'LoL Esports', youtubeChannelId: 'UCvqRdlKsE5Q8mf8YXbdIJLw', priority: 2 },
]

const byName = new Map(MONITORED_CHANNELS.map((c) => [c.name, c]))
export function channelByName(name: string): MonitoredChannel | undefined {
  return byName.get(name)
}

/** All distinct user-facing brands, preserving config order. */
export const MONITORED_BRANDS: string[] = [
  ...new Set(MONITORED_CHANNELS.map((c) => c.brand)),
]

/** A representative channel for the brand — used for league-hint lookups
 *  (every channel in a brand shares the same leagueSlug). */
const byBrand = new Map<string, MonitoredChannel>()
for (const c of MONITORED_CHANNELS) {
  if (!byBrand.has(c.brand)) byBrand.set(c.brand, c)
}
export function channelByBrand(brand: string): MonitoredChannel | undefined {
  return byBrand.get(brand)
}

/** Priority of a brand = min priority across its channels. Lower wins. */
const brandPriorities = new Map<string, number>()
for (const c of MONITORED_CHANNELS) {
  const cur = brandPriorities.get(c.brand) ?? Number.POSITIVE_INFINITY
  if (c.priority < cur) brandPriorities.set(c.brand, c.priority)
}
export function brandPriority(brand: string): number {
  return brandPriorities.get(brand) ?? 99
}

/** Back-compat alias — many sites still call this with what is, after the
 *  brand refactor, a brand name. Routes through brandPriority(). */
export function channelPriority(brand: string): number {
  return brandPriority(brand)
}
