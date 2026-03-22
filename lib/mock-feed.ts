import type { FeedDay, FeedMatch } from './types'

export function getDateLabel(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'

  // Format as "March 20"
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function dateStrOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export function getMockFeed(): FeedDay[] {
  const todayStr = dateStrOffset(0)       // Mar 22
  const yesterdayStr = dateStrOffset(1)    // Mar 21
  const twoDaysAgoStr = dateStrOffset(2)   // Mar 20
  const threeDaysAgoStr = dateStrOffset(3) // Mar 19

  return [
    {
      date: todayStr,
      label: getDateLabel(todayStr),
      matches: [
        {
          id: 'fs-2026-finals-g2-blg',
          teamA: 'G2 Esports',
          teamB: 'BLG',
          eventName: 'First Stand 2026 Grand Finals',
          format: 'bo5',
          youtubeVideoId: 'eJOk4VN2fAE',
          channelName: 'Caedrel',
          watched: false,
        },
      ],
    },
    {
      date: yesterdayStr,
      label: getDateLabel(yesterdayStr),
      matches: [
        {
          id: 'fs-2026-sf-jdg-blg',
          teamA: 'JDG',
          teamB: 'BLG',
          eventName: 'First Stand 2026 Semifinals',
          format: 'bo3',
          youtubeVideoId: 'bj_DGC9tBmY',
          channelName: 'Caedrel',
          watched: false,
        },
        {
          id: 'fs-2026-sf-g2-geng',
          teamA: 'G2 Esports',
          teamB: 'Gen.G',
          eventName: 'First Stand 2026 Semifinals',
          format: 'bo3',
          youtubeVideoId: 'PdYOkY9Xfno',
          channelName: 'Caedrel',
          watched: false,
        },
        {
          id: 'fs-2026-ko-lyon-jdg',
          teamA: 'Lyon Gaming',
          teamB: 'JDG',
          eventName: 'First Stand 2026 Knockout',
          format: 'bo1',
          youtubeVideoId: 'sV3UKUWHMv4',
          channelName: 'Caedrel',
          watched: false,
        },
      ],
    },
    {
      date: twoDaysAgoStr,
      label: getDateLabel(twoDaysAgoStr),
      matches: [
        {
          id: 'fs-2026-ko-g2-fearx',
          teamA: 'G2 Esports',
          teamB: 'FearX',
          eventName: 'First Stand 2026 Knockout',
          format: 'bo1',
          youtubeVideoId: 'tgPyvPIEJxs',
          channelName: 'Caedrel',
          watched: false,
        },
      ],
    },
    {
      date: threeDaysAgoStr,
      label: getDateLabel(threeDaysAgoStr),
      matches: [
        {
          id: 'fs-2026-grp-loud-jdg',
          teamA: 'LOUD',
          teamB: 'JDG',
          eventName: 'First Stand 2026 Groups',
          format: 'bo1',
          youtubeVideoId: 'ufzqmH9GjtI',
          channelName: 'Caedrel',
          watched: true,
        },
        {
          id: 'fs-2026-grp-geng-lyon',
          teamA: 'Gen.G',
          teamB: 'Lyon Gaming',
          eventName: 'First Stand 2026 Groups',
          format: 'bo1',
          youtubeVideoId: 'cg6sbrSzVms',
          channelName: 'Caedrel',
          watched: true,
        },
      ],
    },
  ]
}
