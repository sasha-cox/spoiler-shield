import { TEAM_ALIASES } from './teams.generated'

export { TEAM_ALIASES }

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
