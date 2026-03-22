const TEAM_ALIASES: Record<string, string[]> = {
  'T1': ['T1', 'SKT', 'SKT T1', 'SK Telecom T1'],
  'Gen.G': ['Gen.G', 'GenG', 'GEN', 'GENG'],
  'G2 Esports': ['G2 Esports', 'G2'],
  'Fnatic': ['Fnatic', 'FNC'],
  'Cloud9': ['Cloud9', 'C9'],
  'FlyQuest': ['FlyQuest', 'FLY'],
  'BLG': ['BLG', 'Bilibili Gaming'],
  'JDG': ['JDG', 'JD Gaming'],
  'Weibo Gaming': ['Weibo Gaming', 'WBG'],
  'FearX': ['FearX', 'BFX', 'Brion FearX'],
  'DK': ['DK', 'Dplus KIA', 'DWG', 'DAMWON'],
  'Lyon Gaming': ['Lyon Gaming', 'Lyon', 'LYON'],
  'LOUD': ['LOUD', 'Loud'],
  'Karmine Corp': ['Karmine Corp', 'KC'],
  'Team Vitality': ['Team Vitality', 'VIT', 'Vitality'],
  'MOUZ KOI': ['MOUZ KOI', 'MKOI', 'MOUZ'],
  'TSW': ['TSW', 'Team Spirit Wolves'],
  'Hanwha Life Esports': ['Hanwha Life Esports', 'HLE'],
  'KT Rolster': ['KT Rolster', 'KT'],
  // NA
  'Team Liquid': ['Team Liquid', 'TL'],
  '100 Thieves': ['100 Thieves', '100T'],
  'Dignitas': ['Dignitas', 'DIG'],
  'NRG': ['NRG'],
  'Evil Geniuses': ['Evil Geniuses', 'EG'],
  'Immortals': ['Immortals', 'IMT'],
  // EU
  'MAD Lions': ['MAD Lions', 'MAD'],
  'Rogue': ['Rogue', 'RGE'],
  'Team Heretics': ['Team Heretics', 'TH'],
  'SK Gaming': ['SK Gaming', 'SK'],
  'Astralis': ['Astralis', 'AST'],
  // CN
  'Top Esports': ['Top Esports', 'TES'],
  'EDward Gaming': ['EDward Gaming', 'EDG'],
  'Royal Never Give Up': ['Royal Never Give Up', 'RNG'],
  'LNG Esports': ['LNG Esports', 'LNG'],
  'OMG': ['OMG'],
  // KR
  'DRX': ['DRX'],
  'Kwangdong Freecs': ['Kwangdong Freecs', 'KDF'],
  'Nongshim RedForce': ['Nongshim RedForce', 'NS'],
  'Liiv SANDBOX': ['Liiv SANDBOX', 'LSB'],
  // BR
  'paiN Gaming': ['paiN Gaming', 'paiN', 'PAIN'],
  'FURIA': ['FURIA'],
  'RED Canids': ['RED Canids', 'RED'],
  'KaBuM': ['KaBuM', 'KBM'],
}

// Build reverse lookup: alias (lowercase) -> canonical name
const aliasMap = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
  for (const alias of aliases) {
    aliasMap.set(alias.toLowerCase(), canonical)
  }
}

export function normalizeTeamName(input: string): string | null {
  return aliasMap.get(input.toLowerCase().trim()) ?? null
}

export function extractTeamsFromTitle(title: string): [string, string] | null {
  const match = title.match(/(.+?)\s+(?:VS|vs|Vs|v\.?s\.?)\s+(.+?)(?:\s*[-–—|]|$)/i)
  if (!match) return null

  const rawA = match[1].trim()
  const rawB = match[2].trim()

  // Try to find team names by checking each alias against the raw strings
  let teamA: string | null = null
  let teamB: string | null = null

  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (!teamA && re.test(rawA)) teamA = canonical
      if (!teamB && re.test(rawB)) teamB = canonical
    }
  }

  if (teamA && teamB) return [teamA, teamB]
  return null
}
