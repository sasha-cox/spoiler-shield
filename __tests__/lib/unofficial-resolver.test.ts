import { describe, it, expect } from 'vitest'
import { buildUnofficialMatches } from '@/lib/unofficial-resolver'
import type { RawUpload } from '@/lib/feed-utils'

function upload(over: Partial<RawUpload> = {}): RawUpload {
  return {
    videoId: over.videoId ?? 'v1',
    title: over.title ?? '',
    publishedAt: over.publishedAt ?? new Date('2026-04-29T20:00:00Z'),
    channelName: over.channelName ?? 'Caedrel',
  }
}

describe('buildUnofficialMatches', () => {
  it('builds an unofficial entry from a clean creator-title with two known teams', () => {
    const out = buildUnofficialMatches([
      upload({ title: 'G2 Esports vs Fnatic | THE EU SHOWMATCH' }),
    ])
    expect(out).toHaveLength(1)
    expect(out[0].kind).toBe('unofficial')
    expect(out[0].teamA).toBe('G2 Esports')
    expect(out[0].teamB).toBe('Fnatic')
  })

  it('rejects titles where one side is a player nickname (not a team alias)', () => {
    const out = buildUnofficialMatches([
      upload({ title: 'ZEUS vs KINGEN | inhouse' }),
    ])
    expect(out).toHaveLength(0)
  })

  it('rejects titles with multiple "vs" pairs (ambiguous)', () => {
    const out = buildUnofficialMatches([
      upload({ title: 'G2 vs FNC vs T1 vs DK | LEC bo10' }),
    ])
    expect(out).toHaveLength(0)
  })

  it('rejects HIGHLIGHTS / recap / preview uploads', () => {
    expect(buildUnofficialMatches([upload({ title: 'G2 vs FNC HIGHLIGHTS' })])).toHaveLength(0)
    expect(buildUnofficialMatches([upload({ title: 'G2 vs FNC | recap' })])).toHaveLength(0)
    expect(buildUnofficialMatches([upload({ title: 'G2 vs FNC #shorts' })])).toHaveLength(0)
  })

  it('rejects titles where the same canonical team appears on both sides', () => {
    const out = buildUnofficialMatches([
      upload({ title: 'G2 vs G2 mirror match' }),
    ])
    expect(out).toHaveLength(0)
  })

  it('dedupes the same matchup on the same date, preferring higher-priority channel', () => {
    const out = buildUnofficialMatches([
      upload({
        videoId: 'official',
        channelName: 'LCK',
        title: 'G2 Esports vs Fnatic | full match',
        publishedAt: new Date('2026-04-29T10:00:00Z'),
      }),
      upload({
        videoId: 'caedrel',
        channelName: 'Caedrel',
        title: 'G2 Esports vs Fnatic | what a game',
        publishedAt: new Date('2026-04-29T18:00:00Z'),
      }),
    ])
    expect(out).toHaveLength(1)
    expect(out[0].youtubeVideoId).toBe('caedrel')
  })

  it('attaches the canonical team names from the alias map, not the raw title casing', () => {
    const out = buildUnofficialMatches([
      upload({ title: 'g2 vs fnatic | early-morning ranked clash' }),
    ])
    expect(out[0].teamA).toBe('G2 Esports')
    expect(out[0].teamB).toBe('Fnatic')
  })
})
