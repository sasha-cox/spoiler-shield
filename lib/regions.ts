import { TEAM_REGIONS } from './teams.generated'

export interface Region {
  id: string
  name: string
  shortCode: string
  flag: string
  color: string  // Tailwind-compatible color for badges
}

export const REGIONS: Record<string, Region> = {
  KR: { id: 'KR', name: 'Korea', shortCode: 'LCK', flag: '🇰🇷', color: '#3B82F6' },
  EU: { id: 'EU', name: 'Europe', shortCode: 'LEC', flag: '🇪🇺', color: '#22C55E' },
  NA: { id: 'NA', name: 'North America', shortCode: 'LCS', flag: '🇺🇸', color: '#EF4444' },
  CN: { id: 'CN', name: 'China', shortCode: 'LPL', flag: '🇨🇳', color: '#F97316' },
  BR: { id: 'BR', name: 'Brazil', shortCode: 'CBLOL', flag: '🇧🇷', color: '#FACC15' },
  INT: { id: 'INT', name: 'International', shortCode: 'INT', flag: '🌍', color: '#D4A843' },
}

// Event name keywords that indicate a region. Order matters — longer / more
// specific patterns first so "LCK Challengers" doesn't match plain "LCK"
// when both keywords exist (Object.entries preserves insertion order).
const EVENT_REGIONS: Record<string, string> = {
  // International
  'WORLDS': 'INT', 'MSI': 'INT', 'FIRST STAND': 'INT', 'EMEA MASTERS': 'INT', 'AMERICAS CUP': 'INT',
  // KR
  'LCK CHALLENGERS': 'KR', 'LCK': 'KR',
  // EU
  'LEC': 'EU', 'LFL': 'EU', 'PRIME LEAGUE': 'EU', 'NLC': 'EU', 'HITPOINT': 'EU',
  'LA LIGUE FRANÇAISE': 'EU', 'LA LIGUE FRANCAISE': 'EU',
  // NA
  'LCS': 'NA', 'NACL': 'NA',
  // CN
  'LPL': 'CN',
  // BR
  'CBLOL': 'BR', 'CIRCUITO DESAFIANTE': 'BR',
  // Pacific / Asia
  'LCP': 'INT', 'LJL': 'INT', 'VCS': 'INT',
}

export function getRegionForTeam(teamName: string): Region | null {
  const regionId = TEAM_REGIONS[teamName]
  return regionId ? REGIONS[regionId] : null
}

export function getRegionForEvent(eventName: string): Region | null {
  const upper = eventName.toUpperCase()
  for (const [keyword, regionId] of Object.entries(EVENT_REGIONS)) {
    if (upper.includes(keyword)) return REGIONS[regionId]
  }
  return null
}

export function getRegion(teamA: string, teamB: string, eventName: string): Region {
  // Try event first (most reliable for international events)
  const eventRegion = getRegionForEvent(eventName)
  if (eventRegion) return eventRegion
  // Then try teams
  const regionA = getRegionForTeam(teamA)
  const regionB = getRegionForTeam(teamB)
  // If both teams same region, use that
  if (regionA && regionB && regionA.id === regionB.id) return regionA
  // If mixed regions, it's international
  if (regionA && regionB && regionA.id !== regionB.id) return REGIONS.INT
  // Return whatever we found, or default to INT
  return regionA ?? regionB ?? REGIONS.INT
}
