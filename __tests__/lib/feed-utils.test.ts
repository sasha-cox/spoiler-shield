import { describe, it, expect } from 'vitest'
import { getDateLabel, buildFeedFromSchedule } from '@/lib/feed-utils'
import type { ScheduledMatch } from '@/lib/lolesports'
import type { VodCandidate } from '@/lib/match-vod-resolver'

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
    expect(getDateLabel('2025-01-15')).toBe('January 15')
  })
})

function makeScheduled(overrides: Partial<ScheduledMatch> = {}): ScheduledMatch {
  return {
    id: overrides.id ?? 'm1',
    leagueSlug: 'lck',
    leagueName: 'LCK',
    blockName: 'Week 5',
    startTime: '2026-04-22T08:00:00Z',
    teamA: { name: 'Hanwha Life Esports', code: 'HLE' },
    teamB: { name: 'Nongshim RedForce', code: 'NS' },
    format: 'bo3',
    hasVod: true,
    ...overrides,
  }
}

function makeVod(videoId: string, channelName: string): VodCandidate {
  return {
    upload: {
      videoId,
      title: 'sample',
      publishedAt: new Date('2026-04-22T15:00:00Z'),
      channelName,
    },
    channelPriority: 0,
  }
}

describe('buildFeedFromSchedule', () => {
  it('builds a day-grouped feed from scheduled matches with resolved VODs', () => {
    const schedule: ScheduledMatch[] = [
      makeScheduled({ id: 'a', startTime: '2026-04-22T08:00:00Z' }),
      makeScheduled({
        id: 'b',
        startTime: '2026-04-21T08:00:00Z',
        teamA: { name: 'T1', code: 'T1' },
        teamB: { name: 'Gen.G', code: 'GEN' },
      }),
    ]
    const vods = new Map([
      ['a', makeVod('vidA', 'Caedrel')],
      ['b', makeVod('vidB', 'LCK')],
    ])
    const feed = buildFeedFromSchedule(schedule, vods)
    expect(feed).toHaveLength(2)
    expect(feed[0].date).toBe('2026-04-22')
    expect(feed[0].matches[0].teamA).toBe('Hanwha Life Esports')
    expect(feed[0].matches[0].teamB).toBe('Nongshim RedForce')
    expect(feed[0].matches[0].youtubeVideoId).toBe('vidA')
    expect(feed[1].date).toBe('2026-04-21')
    expect(feed[1].matches[0].teamA).toBe('T1')
  })

  it('drops scheduled matches with no resolved VOD (cant watch what we cant find)', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const feed = buildFeedFromSchedule(schedule, new Map())
    expect(feed).toEqual([])
  })

  it('uses canonical schedule team names regardless of upload title', () => {
    const schedule = [makeScheduled({ id: 'a' })]
    const vods = new Map([
      [
        'a',
        {
          upload: {
            videoId: 'v',
            title: 'ZEUS vs KINGEN | players nicknames in title',
            publishedAt: new Date('2026-04-22T15:00:00Z'),
            channelName: 'Caedrel',
          },
          channelPriority: 0,
        },
      ],
    ])
    const feed = buildFeedFromSchedule(schedule, vods)
    expect(feed[0].matches[0].teamA).toBe('Hanwha Life Esports')
    expect(feed[0].matches[0].teamB).toBe('Nongshim RedForce')
  })

  it('format and event name come from schedule, not upload title', () => {
    const schedule = [
      makeScheduled({
        id: 'a',
        format: 'bo5',
        leagueName: 'LCK',
        blockName: 'Spring Playoffs',
      }),
    ]
    const vods = new Map([['a', makeVod('v', 'Caedrel')]])
    const feed = buildFeedFromSchedule(schedule, vods)
    expect(feed[0].matches[0].format).toBe('bo5')
    expect(feed[0].matches[0].eventName).toBe('LCK Spring Playoffs')
  })

  it('returns empty array when schedule is empty', () => {
    expect(buildFeedFromSchedule([], new Map())).toEqual([])
  })
})
