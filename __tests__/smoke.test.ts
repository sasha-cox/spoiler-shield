import { describe, it, expect } from 'vitest'

describe('smoke test', () => {
  it('can import shared feed utilities', async () => {
    const utils = await import('@/lib/feed-utils')
    expect(typeof utils.getDateLabel).toBe('function')
    expect(typeof utils.guessFormat).toBe('function')
    expect(typeof utils.extractTeams).toBe('function')
    expect(typeof utils.isMatchContent).toBe('function')
    expect(typeof utils.buildFeedFromUploads).toBe('function')
  })
})
