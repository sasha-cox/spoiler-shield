const STORAGE_KEY = 'spoiler-shield-watched'

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

export function markWatched(vodId: string): void {
  const set = readSet()
  set.add(vodId)
  writeSet(set)
}

export function isWatched(vodId: string): boolean {
  return readSet().has(vodId)
}

export function getWatchedVods(): Set<string> {
  return readSet()
}

export function unmarkWatched(vodId: string): void {
  const set = readSet()
  set.delete(vodId)
  writeSet(set)
}
