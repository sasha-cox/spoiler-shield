/**
 * Per-user preferences for which brands and leagues the feed should show.
 * Lives in localStorage so we don't need any account state on the server.
 *
 * The shape: a set of opted-OUT identifiers per dimension. Empty set means
 * "show everything" — that's the default and the right behaviour for a
 * first-time visitor who hasn't configured anything yet. Storing opt-outs
 * (rather than opt-ins) means that when we add a new league or brand later,
 * existing users automatically see it instead of silently missing content.
 */

const STORAGE_KEY = 'spoiler-shield-prefs'

export interface Preferences {
  /** Brands the user has explicitly hidden. */
  hiddenBrands: Set<string>
  /** League slugs the user has explicitly hidden. */
  hiddenLeagues: Set<string>
  /** Region IDs the user has explicitly hidden — useful when a user wants
   *  to mute an entire region without hiding individual leagues. */
  hiddenRegions: Set<string>
}

interface SerializedPreferences {
  hiddenBrands: string[]
  hiddenLeagues: string[]
  hiddenRegions: string[]
}

function emptyPreferences(): Preferences {
  return {
    hiddenBrands: new Set(),
    hiddenLeagues: new Set(),
    hiddenRegions: new Set(),
  }
}

export function getPreferences(): Preferences {
  if (typeof window === 'undefined') return emptyPreferences()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyPreferences()
    const parsed = JSON.parse(raw) as Partial<SerializedPreferences>
    return {
      hiddenBrands: new Set(parsed.hiddenBrands ?? []),
      hiddenLeagues: new Set(parsed.hiddenLeagues ?? []),
      hiddenRegions: new Set(parsed.hiddenRegions ?? []),
    }
  } catch {
    return emptyPreferences()
  }
}

export function savePreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return
  const serialized: SerializedPreferences = {
    hiddenBrands: [...prefs.hiddenBrands],
    hiddenLeagues: [...prefs.hiddenLeagues],
    hiddenRegions: [...prefs.hiddenRegions],
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
  } catch {
    // Quota exceeded or storage disabled — silently degrade.
  }
}

export function toggleBrand(prefs: Preferences, brand: string): Preferences {
  const next = { ...prefs, hiddenBrands: new Set(prefs.hiddenBrands) }
  next.hiddenBrands.has(brand) ? next.hiddenBrands.delete(brand) : next.hiddenBrands.add(brand)
  return next
}

export function toggleLeague(prefs: Preferences, leagueSlug: string): Preferences {
  const next = { ...prefs, hiddenLeagues: new Set(prefs.hiddenLeagues) }
  next.hiddenLeagues.has(leagueSlug) ? next.hiddenLeagues.delete(leagueSlug) : next.hiddenLeagues.add(leagueSlug)
  return next
}

export function toggleRegion(prefs: Preferences, regionId: string): Preferences {
  const next = { ...prefs, hiddenRegions: new Set(prefs.hiddenRegions) }
  next.hiddenRegions.has(regionId) ? next.hiddenRegions.delete(regionId) : next.hiddenRegions.add(regionId)
  return next
}

export function resetPreferences(): Preferences {
  return emptyPreferences()
}
