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

// Map canonical team names to their region
const TEAM_REGIONS: Record<string, string> = {
  'T1': 'KR', 'Gen.G': 'KR', 'DK': 'KR', 'Hanwha Life Esports': 'KR', 'KT Rolster': 'KR', 'FearX': 'KR',
  'G2 Esports': 'EU', 'Fnatic': 'EU', 'Karmine Corp': 'EU', 'Team Vitality': 'EU', 'MOUZ KOI': 'EU',
  'Cloud9': 'NA', 'FlyQuest': 'NA', 'Team Liquid': 'NA', '100 Thieves': 'NA', 'Dignitas': 'NA', 'NRG': 'NA',
  'Lyon Gaming': 'NA',
  'BLG': 'CN', 'JDG': 'CN', 'Weibo Gaming': 'CN', 'Top Esports': 'CN', 'EDward Gaming': 'CN',
  'Royal Never Give Up': 'CN',
  'LOUD': 'BR',
}

// Event name keywords that indicate a region
const EVENT_REGIONS: Record<string, string> = {
  'LCK': 'KR', 'LEC': 'EU', 'LCS': 'NA', 'LPL': 'CN', 'CBLOL': 'BR',
  'WORLDS': 'INT', 'MSI': 'INT', 'FIRST STAND': 'INT',
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
