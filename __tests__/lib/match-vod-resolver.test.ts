import { describe, it, expect } from 'vitest'
import { resolveVodsForSchedule } from '@/lib/match-vod-resolver'
import type { ScheduledMatch } from '@/lib/lolesports'
import type { RawUpload } from '@/lib/feed-utils'

function makeScheduled(over: Partial<ScheduledMatch> = {}): ScheduledMatch {
  return {
    id: over.id ?? 'm1',
    leagueSlug: 'lck',
    leagueName: 'LCK',
    blockName: 'Week 5',
    startTime: '2026-04-22T08:00:00Z',
    teamA: { name: 'Hanwha Life Esports', code: 'HLE' },
    teamB: { name: 'Nongshim RedForce', code: 'NS' },
    format: 'bo3',
    hasVod: true,
    ...over,
  }
}

function upload(over: Partial<RawUpload> = {}): RawUpload {
  return {
    videoId: over.videoId ?? 'v1',
    title: over.title ?? '',
    publishedAt: over.publishedAt ?? new Date('2026-04-22T15:00:00Z'),
    channelName: over.channelName ?? 'Caedrel',
  }
}

describe('resolveVodsForSchedule', () => {
  it('attaches an upload to the right scheduled match by team code in title', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({
        title: 'ZEUS vs KINGEN | HLE VS NS HEATS UP LCK SPRING 2026',
      }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.has('a')).toBe(true)
    expect(byMatchId.get('a')?.upload.videoId).toBe('v1')
  })

  it('matches via canonical team name when code is not in title', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({
        title: 'Hanwha Life Esports vs Nongshim RedForce | LCK Spring',
      }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.has('a')).toBe(true)
  })

  it('drops uploads where league hint disagrees with schedule league', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({
        title: 'HLE VS NS | LEC SPRING 2026',  // wrong league
      }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.size).toBe(0)
  })

  it('drops uploads outside the time window relative to scheduled startTime', () => {
    const schedule = [makeScheduled({ id: 'a', startTime: '2026-04-22T08:00:00Z' })]
    const uploads = [
      upload({
        title: 'HLE VS NS | LCK',
        publishedAt: new Date('2026-04-26T08:00:00Z'),  // 4 days after, outside 36h window
      }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.size).toBe(0)
  })

  it('refuses to guess when title matches multiple scheduled matches in the window', () => {
    const schedule = [
      makeScheduled({ id: 'a', startTime: '2026-04-22T08:00:00Z' }),
      makeScheduled({
        id: 'b',
        startTime: '2026-04-22T11:00:00Z',
        teamA: { name: 'T1', code: 'T1' },
        teamB: { name: 'Gen.G', code: 'GEN' },
      }),
    ]
    // Title contains team codes for BOTH matches — ambiguous, should drop.
    const uploads = [
      upload({ title: 'HLE NS T1 GEN | LCK BIG WEEK COMPILATION' }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.size).toBe(0)
  })

  it('prefers higher-priority channel when multiple uploads resolve to the same match', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({
        videoId: 'official',
        channelName: 'LCK',
        title: 'HLE vs NS | LCK 2026',
        publishedAt: new Date('2026-04-22T10:00:00Z'),
      }),
      upload({
        videoId: 'caedrel',
        channelName: 'Caedrel',
        title: 'HLE vs NS LCK 2026',
        publishedAt: new Date('2026-04-22T20:00:00Z'),
      }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.get('a')?.upload.videoId).toBe('caedrel')
  })

  it('uses channel name as a league hint when title is bare', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({
        title: 'HLE vs NS | what a series',  // no league mention
        channelName: 'LCK',
      }),
    ]
    const { byMatchId } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.has('a')).toBe(true)
  })

  it('returns uploads with no schedule match as orphans', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({ title: 'Caedrel showmatch G2 vs T1' }),
    ]
    const { byMatchId, orphans } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.size).toBe(0)
    expect(orphans).toHaveLength(1)
  })

  it('drops highlights uploads entirely (not even orphan candidates)', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const uploads = [
      upload({ title: 'HLE vs NS HIGHLIGHTS | LCK Spring 2026' }),
    ]
    const { byMatchId, orphans } = resolveVodsForSchedule(schedule, uploads)
    expect(byMatchId.size).toBe(0)
    expect(orphans).toHaveLength(0)
  })
})
