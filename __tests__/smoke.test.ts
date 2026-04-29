import { describe, it, expect } from 'vitest'

describe('smoke test', () => {
  it('can import the feed pipeline modules', async () => {
    const utils = await import('@/lib/feed-utils')
    const lolesports = await import('@/lib/lolesports')
    const resolver = await import('@/lib/match-vod-resolver')
    expect(typeof utils.getDateLabel).toBe('function')
    expect(typeof utils.buildFeedFromSchedule).toBe('function')
    expect(typeof lolesports.getRecentScheduledMatches).toBe('function')
    expect(typeof resolver.resolveVodsForSchedule).toBe('function')
  })
})
