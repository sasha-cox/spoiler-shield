const STORAGE_KEY = 'spoiler-shield-follows'

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr: unknown = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((v): v is string => typeof v === 'string'))
  } catch {
    return new Set()
  }
}

function writeSet(set: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function followTeam(canonicalName: string): void {
  const set = readSet()
  set.add(canonicalName)
  writeSet(set)
}

export function unfollowTeam(canonicalName: string): void {
  const set = readSet()
  set.delete(canonicalName)
  writeSet(set)
}

export function getFollowedTeams(): Set<string> {
  return readSet()
}

export function isFollowed(canonicalName: string): boolean {
  return readSet().has(canonicalName)
}
