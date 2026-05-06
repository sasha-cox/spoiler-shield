/**
 * Single source of truth for "what teams exist" and "what's their canonical
 * display name." Built by fusing live lolesports schedule data with the
 * hand-maintained overrides in `team-overrides.ts`.
 *
 * The registry is rebuilt every time the schedule cache turns over (~30
 * minutes), which means new teams entering a tracked league appear
 * automatically without any code change. Historical/creator-only teams
 * that aren't in the schedule are surfaced via the overrides file.
 *
 * Three lookup paths:
 *   - canonicalize(name)   — fix lolesports casing or apply override
 *   - findTeam(token)      — resolve name/code/alias to a team record
 *   - getRegistry()        — full registry, used by the unofficial-resolver
 */

import { TEAM_OVERRIDES } from './team-overrides'
import { getRecentScheduledMatches, type ScheduledMatch } from './lolesports'
import { leagueBySlug } from './leagues'
import type { RegionId } from './leagues'

export interface TeamRecord {
  canonical: string
  /** All known names/codes/aliases for this team, lowercased & deduped. */
  aliases: Set<string>
  /** Region ID derived from the team's most recent league assignment. INT
   *  if the team hasn't appeared in any tracked league recently. */
  regionId: RegionId
}

export interface BuiltRegistryShape {
  /** lowercased token → canonical name */
  byAlias: Map<string, string>
  /** canonical name → record */
  byCanonical: Map<string, TeamRecord>
  /** All canonical names for downstream iteration */
  canonicals: Set<string>
}

type BuiltRegistry = BuiltRegistryShape

let cached: { registry: BuiltRegistry; timestamp: number } | null = null
const REGISTRY_CACHE_TTL_MS = 30 * 60 * 1000

function smartTitleCase(name: string): string {
  if (name === name.toLowerCase() || name === name.toUpperCase()) {
    return name
      .split(/\s+/)
      .map((w) => (/^[A-Z0-9.]+$/.test(w) && w.length <= 4
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(' ')
  }
  return name
}

function buildRegistry(schedule: ScheduledMatch[]): BuiltRegistry {
  const byAlias = new Map<string, string>()
  const byCanonical = new Map<string, TeamRecord>()

  // Step 1: seed from overrides — these win on canonical name and aliases.
  for (const ov of TEAM_OVERRIDES) {
    const record: TeamRecord = {
      canonical: ov.canonical,
      aliases: new Set(),
      regionId: 'INT',
    }
    for (const alias of ov.aliases) {
      record.aliases.add(alias.toLowerCase())
      byAlias.set(alias.toLowerCase(), ov.canonical)
    }
    record.aliases.add(ov.canonical.toLowerCase())
    byAlias.set(ov.canonical.toLowerCase(), ov.canonical)
    byCanonical.set(ov.canonical, record)
  }

  // Step 2: fold in everything currently in the schedule. Lolesports gives us
  // (name, code) per team — register both. If a team is already known via
  // overrides, the override's canonical wins but we still attach the schedule
  // name + code as additional aliases. Otherwise, use lolesports' name as the
  // canonical (smart-title-cased to fix "BILIBILI GAMING" / "kt Rolster").
  for (const match of schedule) {
    const region = leagueBySlug(match.leagueSlug)?.regionId ?? 'INT'
    for (const team of [match.teamA, match.teamB]) {
      const nameLower = team.name.toLowerCase()
      const codeLower = team.code.toLowerCase()
      const existingCanonical = byAlias.get(nameLower) ?? byAlias.get(codeLower)

      if (existingCanonical) {
        const record = byCanonical.get(existingCanonical)!
        record.aliases.add(nameLower)
        record.aliases.add(codeLower)
        byAlias.set(nameLower, existingCanonical)
        byAlias.set(codeLower, existingCanonical)
        // Region from schedule beats the override default of INT.
        if (record.regionId === 'INT') record.regionId = region
      } else {
        const canonical = smartTitleCase(team.name)
        const record: TeamRecord = {
          canonical,
          aliases: new Set([canonical.toLowerCase(), nameLower, codeLower]),
          regionId: region,
        }
        byCanonical.set(canonical, record)
        byAlias.set(canonical.toLowerCase(), canonical)
        byAlias.set(nameLower, canonical)
        byAlias.set(codeLower, canonical)
      }
    }
  }

  return {
    byAlias,
    byCanonical,
    canonicals: new Set(byCanonical.keys()),
  }
}

/**
 * Returns the registry, building it lazily and caching for 30 minutes.
 * Mirrors the schedule cache TTL so a single schedule refresh refreshes
 * the registry too.
 */
export async function getRegistry(): Promise<BuiltRegistry> {
  if (cached && Date.now() - cached.timestamp < REGISTRY_CACHE_TTL_MS) {
    return cached.registry
  }
  const schedule = await getRecentScheduledMatches(60) // wider window for registry coverage
  const registry = buildRegistry(schedule)
  cached = { registry, timestamp: Date.now() }
  return registry
}

/** Test/dev hook — clear the cache. */
export function clearRegistryCache(): void {
  cached = null
}

/** Build a registry directly from the given schedule without caching.
 *  Used by `build-feed.ts` to share the same schedule fetch across resolvers. */
export function buildRegistryFromSchedule(schedule: ScheduledMatch[]): BuiltRegistry {
  return buildRegistry(schedule)
}

/**
 * Look up a token (name, code, alias) in the registry. Returns the team
 * record or null. Token is lowercased internally.
 */
export function findTeam(registry: BuiltRegistry, token: string): TeamRecord | null {
  const canonical = registry.byAlias.get(token.toLowerCase().trim())
  if (!canonical) return null
  return registry.byCanonical.get(canonical) ?? null
}

/**
 * Canonicalize a team name. If the registry knows the name (via lolesports,
 * an alias, or an override), return the registry's canonical. Otherwise fall
 * back to smart-title-casing the input.
 */
export function canonicalize(registry: BuiltRegistry, name: string, code?: string): string {
  const found =
    findTeam(registry, name) ??
    (code ? findTeam(registry, code) : null)
  return found?.canonical ?? smartTitleCase(name)
}
