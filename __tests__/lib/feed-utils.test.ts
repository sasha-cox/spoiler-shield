import { describe, it, expect } from 'vitest'
import {
  getDateLabel,
  guessFormat,
  extractTeams,
  extractEventName,
  isMatchContent,
  dedupKey,
  buildFeedFromUploads,
} from '@/lib/feed-utils'
import type { RawUpload } from '@/lib/feed-utils'

describe('getDateLabel', () => {
  it('returns "Today" for today\'s date', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(getDateLabel(today)).toBe('Today')
  })

  it('returns "Yesterday" for yesterday\'s date', () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    expect(getDateLabel(d.toISOString().slice(0, 10))).toBe('Yesterday')
  })

  it('returns formatted date for older dates', () => {
    const result = getDateLabel('2025-01-15')
    expect(result).toBe('January 15')
  })
})

describe('guessFormat', () => {
  it('detects BO5 from title', () => {
    expect(guessFormat('T1 vs Gen.G - BO5 Grand Finals')).toBe('bo5')
  })

  it('detects GRAND FINAL as bo5', () => {
    expect(guessFormat('GRAND FINAL 2026 - G2 VS BLG')).toBe('bo5')
  })

  it('detects BO3 from title', () => {
    expect(guessFormat('T1 vs DK - BO3 Playoffs')).toBe('bo3')
  })

  it('detects SEMI FINAL as bo3', () => {
    expect(guessFormat('SEMI FINAL - FNC vs G2')).toBe('bo3')
  })

  it('defaults to bo1', () => {
    expect(guessFormat('T1 vs Gen.G - LCK Spring 2026')).toBe('bo1')
  })
})

describe('extractTeams', () => {
  it('extracts teams from "Team A vs Team B" pattern', () => {
    const result = extractTeams('T1 vs Gen.G - LCK Spring')
    expect(result).toEqual({ teamA: 'T1', teamB: 'Gen.G' })
  })

  it('extracts teams from Caedrel-style titles', () => {
    const result = extractTeams('G2 VS BLG - FIRST STAND GRAND FINALS 2026')
    expect(result).toEqual({ teamA: 'G2 Esports', teamB: 'Bilibili Gaming' })
  })

  it('returns null for non-match titles', () => {
    expect(extractTeams('LCK Spring 2026 Highlights')).toBeNull()
  })

  it('returns null for titles without vs', () => {
    expect(extractTeams('Interview with Faker after winning LCK')).toBeNull()
  })
})

describe('extractEventName', () => {
  it('extracts event from dash-separated title', () => {
    const result = extractEventName('FIRST STAND GRAND FINALS 2026 - G2 VS BLG', 'G2 Esports', 'BLG')
    expect(result).toBe('FIRST STAND GRAND FINALS 2026')
  })

  it('picks segment with tournament keyword', () => {
    const result = extractEventName('LOSER GOES HOME - LOUD VS JDG - FIRST STAND 2026', 'LOUD', 'JDG')
    expect(result).toBe('FIRST STAND 2026')
  })

  it('falls back to full title if no event found', () => {
    const result = extractEventName('T1 vs G2', 'T1', 'G2 Esports')
    expect(result).toBe('T1 vs G2')
  })
})

describe('isMatchContent', () => {
  it('returns true for match titles', () => {
    expect(isMatchContent('T1 vs Gen.G - LCK Spring 2026')).toBe(true)
  })

  it('returns false for interview titles', () => {
    expect(isMatchContent('Interview with Faker')).toBe(false)
  })

  it('returns false for highlights', () => {
    expect(isMatchContent('T1 vs Gen.G Highlights')).toBe(false)
  })

  it('returns false for titles without vs', () => {
    expect(isMatchContent('LCK Spring 2026 Tier List')).toBe(false)
  })

  it('returns false for CJK-heavy titles', () => {
    expect(isMatchContent('T1 vs Gen.G 한국어 방송 인터뷰 하이라이트')).toBe(false)
  })

  it('returns false for recap content', () => {
    expect(isMatchContent('T1 vs Gen.G recap and analysis')).toBe(false)
  })
})

describe('dedupKey', () => {
  it('creates a consistent key regardless of team order', () => {
    const key1 = dedupKey('T1', 'Gen.G', '2026-03-20')
    const key2 = dedupKey('Gen.G', 'T1', '2026-03-20')
    expect(key1).toBe(key2)
  })

  it('different dates produce different keys', () => {
    const key1 = dedupKey('T1', 'Gen.G', '2026-03-20')
    const key2 = dedupKey('T1', 'Gen.G', '2026-03-21')
    expect(key1).not.toBe(key2)
  })
})

describe('buildFeedFromUploads', () => {
  it('filters out non-match content and groups by date', () => {
    const uploads: RawUpload[] = [
      { videoId: 'v1', title: 'T1 vs Gen.G - LCK Spring 2026', publishedAt: new Date('2026-03-20T12:00:00Z'), channelName: 'LCK' },
      { videoId: 'v2', title: 'LCK Highlights Week 10', publishedAt: new Date('2026-03-20T13:00:00Z'), channelName: 'LCK' },
      { videoId: 'v3', title: 'G2 vs FNC - LEC Spring 2026', publishedAt: new Date('2026-03-19T14:00:00Z'), channelName: 'LEC' },
    ]

    const feed = buildFeedFromUploads(uploads)
    expect(feed).toHaveLength(2) // Two different dates
    expect(feed[0].date).toBe('2026-03-20') // Most recent first
    expect(feed[0].matches).toHaveLength(1) // Highlights filtered out
    expect(feed[0].matches[0].teamA).toBe('T1')
    expect(feed[1].matches[0].teamA).toBe('G2 Esports')
  })

  it('deduplicates same match from different channels, preferring higher priority', () => {
    const uploads: RawUpload[] = [
      { videoId: 'v1', title: 'T1 vs Gen.G - LCK Spring', publishedAt: new Date('2026-03-20T12:00:00Z'), channelName: 'LoL Esports' },
      { videoId: 'v2', title: 'T1 vs Gen.G - LCK Spring', publishedAt: new Date('2026-03-20T13:00:00Z'), channelName: 'LCK' },
    ]

    const feed = buildFeedFromUploads(uploads)
    expect(feed).toHaveLength(1)
    expect(feed[0].matches).toHaveLength(1)
    expect(feed[0].matches[0].channelName).toBe('LCK') // LCK preferred over LoL Esports
  })

  it('returns empty array for empty input', () => {
    expect(buildFeedFromUploads([])).toEqual([])
  })
})
