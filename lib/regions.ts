/**
 * Region metadata for display. Identification of which region a match
 * belongs to comes from the league's `regionId` (see lib/leagues.ts) — the
 * region itself is purely a display concern (flag + accent colour + label).
 */

export interface Region {
  id: 'KR' | 'EU' | 'NA' | 'CN' | 'BR' | 'INT'
  name: string
  /** Short label shown on cards (e.g. "Korea" → "LCK"). Don't use this as
   *  an identifier — multiple leagues can share a region. */
  label: string
  flag: string
  color: string
}

export const REGIONS: Record<Region['id'], Region> = {
  KR:  { id: 'KR',  name: 'Korea',         label: 'LCK',   flag: '🇰🇷', color: '#3B82F6' },
  EU:  { id: 'EU',  name: 'Europe',        label: 'LEC',   flag: '🇪🇺', color: '#22C55E' },
  NA:  { id: 'NA',  name: 'North America', label: 'LCS',   flag: '🇺🇸', color: '#EF4444' },
  CN:  { id: 'CN',  name: 'China',         label: 'LPL',   flag: '🇨🇳', color: '#F97316' },
  BR:  { id: 'BR',  name: 'Brazil',        label: 'CBLOL', flag: '🇧🇷', color: '#FACC15' },
  INT: { id: 'INT', name: 'International', label: 'INT',   flag: '🌍', color: '#D4A843' },
}
