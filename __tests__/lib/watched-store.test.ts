import { describe, it, expect, beforeEach } from 'vitest'
import { markWatched, isWatched, getWatchedVods, unmarkWatched } from '@/lib/watched-store'

const STORAGE_KEY = 'spoiler-shield-watched'

describe('watched-store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ── markWatched ───────────────────────────────────────────────────────────

  it('markWatched(vodId) persists to localStorage', () => {
    markWatched('vid-abc')

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()

    const stored = JSON.parse(raw!) as string[]
    expect(stored).toContain('vid-abc')
  })

  it('markWatched does not duplicate an already-watched ID', () => {
    markWatched('vid-abc')
    markWatched('vid-abc')

    const raw = localStorage.getItem(STORAGE_KEY)
    const stored = JSON.parse(raw!) as string[]
    expect(stored.filter((id) => id === 'vid-abc')).toHaveLength(1)
  })

  // ── isWatched ─────────────────────────────────────────────────────────────

  it('isWatched(vodId) reads back correctly after markWatched', () => {
    markWatched('vid-xyz')

    expect(isWatched('vid-xyz')).toBe(true)
    expect(isWatched('vid-other')).toBe(false)
  })

  // ── getWatchedVods ────────────────────────────────────────────────────────

  it('getWatchedVods() returns a Set of watched VOD IDs', () => {
    markWatched('a')
    markWatched('b')
    markWatched('c')

    const watched = getWatchedVods()
    expect(watched).toBeInstanceOf(Set)
    expect(watched.size).toBe(3)
    expect(watched.has('a')).toBe(true)
    expect(watched.has('b')).toBe(true)
    expect(watched.has('c')).toBe(true)
  })

  // ── Empty localStorage (first use) ────────────────────────────────────────

  it('works when localStorage is empty (first use)', () => {
    // Nothing stored yet
    expect(isWatched('anything')).toBe(false)
    expect(getWatchedVods().size).toBe(0)

    // markWatched should still work
    markWatched('first')
    expect(isWatched('first')).toBe(true)
  })

  // ── unmarkWatched ─────────────────────────────────────────────────────────

  it('unmarkWatched(vodId) removes from the set', () => {
    markWatched('keep')
    markWatched('remove')

    unmarkWatched('remove')

    expect(isWatched('keep')).toBe(true)
    expect(isWatched('remove')).toBe(false)

    const raw = localStorage.getItem(STORAGE_KEY)
    const stored = JSON.parse(raw!) as string[]
    expect(stored).not.toContain('remove')
    expect(stored).toContain('keep')
  })

  it('unmarkWatched is a no-op for an ID that was never watched', () => {
    markWatched('existing')

    // Should not throw
    unmarkWatched('never-watched')

    expect(isWatched('existing')).toBe(true)
    expect(getWatchedVods().size).toBe(1)
  })
})
