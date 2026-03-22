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
  const todayStr = dateStrOffset(0)
  const yesterdayStr = dateStrOffset(1)
  const twoDaysAgoStr = dateStrOffset(2)

  const todayMatches: FeedMatch[] = [
    {
      id: 'lck-2026-w5-t1-geng',
      teamA: 'T1',
      teamB: 'Gen.G',
      eventName: 'LCK Spring 2026 Week 5',
      format: 'bo3',
      games: [
        { gameNumber: 1, youtubeVideoId: 'dQw4w9WgXcQ', channelName: 'Caedrel', watched: true },
        { gameNumber: 2, youtubeVideoId: 'xvFZjo5PgG0', channelName: 'Caedrel', watched: false },
        { gameNumber: 3, youtubeVideoId: undefined, channelName: undefined, watched: false },
      ],
    },
    {
      id: 'lcs-2026-w3-c9-fly',
      teamA: 'Cloud9',
      teamB: 'FlyQuest',
      eventName: 'LCS Spring 2026 Week 3',
      format: 'bo1',
      games: [
        { gameNumber: 1, youtubeVideoId: 'oHg5SJYRHA0', channelName: 'LCS', watched: false },
      ],
    },
    {
      id: 'lec-2026-po-g2-fnc',
      teamA: 'G2 Esports',
      teamB: 'Fnatic',
      eventName: 'LEC Winter 2026 Playoffs',
      format: 'bo5',
      games: [
        { gameNumber: 1, youtubeVideoId: 'ZZ5LpwO-An4', channelName: 'LEC', watched: false },
        { gameNumber: 2, youtubeVideoId: 'L_jWHffIx5E', channelName: 'LEC', watched: false },
        { gameNumber: 3, youtubeVideoId: undefined, channelName: undefined, watched: false },
        { gameNumber: 4, youtubeVideoId: undefined, channelName: undefined, watched: false },
        { gameNumber: 5, youtubeVideoId: undefined, channelName: undefined, watched: false },
      ],
    },
  ]

  const yesterdayMatches: FeedMatch[] = [
    {
      id: 'lck-2026-w5-blg-wb',
      teamA: 'BLG',
      teamB: 'Weibo Gaming',
      eventName: 'LCK Spring 2026 Week 5',
      format: 'bo3',
      games: [
        { gameNumber: 1, youtubeVideoId: 'fJ9rUzIMcZQ', channelName: 'Caedrel', watched: true },
        { gameNumber: 2, youtubeVideoId: 'kffacxfA7G4', channelName: 'Caedrel', watched: true },
        { gameNumber: 3, youtubeVideoId: 'nfWlot6h_JM', channelName: 'Caedrel', watched: false },
      ],
    },
    {
      id: 'lcs-2026-w3-fly-c9-2',
      teamA: 'FlyQuest',
      teamB: 'Cloud9',
      eventName: 'LCS Spring 2026 Week 3',
      format: 'bo1',
      games: [
        { gameNumber: 1, youtubeVideoId: 'hY7m5jjJ9ss', channelName: 'LCS', watched: false },
      ],
    },
  ]

  const twoDaysAgoMatches: FeedMatch[] = [
    {
      id: 'lec-2026-po-g2-fnc-sf',
      teamA: 'G2 Esports',
      teamB: 'Fnatic',
      eventName: 'LEC Winter 2026 Playoffs',
      format: 'bo5',
      games: [
        { gameNumber: 1, youtubeVideoId: 'J---aiyznGQ', channelName: 'LEC', watched: true },
        { gameNumber: 2, youtubeVideoId: 'dQw4w9WgXcQ', channelName: 'LEC', watched: true },
        { gameNumber: 3, youtubeVideoId: 'xvFZjo5PgG0', channelName: 'LEC', watched: true },
        { gameNumber: 4, youtubeVideoId: 'oHg5SJYRHA0', channelName: 'LEC', watched: false },
        { gameNumber: 5, youtubeVideoId: undefined, channelName: undefined, watched: false },
      ],
    },
    {
      id: 'lck-2026-w4-t1-wb',
      teamA: 'T1',
      teamB: 'Weibo Gaming',
      eventName: 'LCK Spring 2026 Week 5',
      format: 'bo3',
      games: [
        { gameNumber: 1, youtubeVideoId: 'ZZ5LpwO-An4', channelName: 'Caedrel', watched: true },
        { gameNumber: 2, youtubeVideoId: 'L_jWHffIx5E', channelName: 'Caedrel', watched: true },
        { gameNumber: 3, youtubeVideoId: 'fJ9rUzIMcZQ', channelName: 'Caedrel', watched: true },
      ],
    },
    {
      id: 'lcs-2026-w2-c9-fly',
      teamA: 'Cloud9',
      teamB: 'FlyQuest',
      eventName: 'LCS Spring 2026 Week 3',
      format: 'bo1',
      games: [
        { gameNumber: 1, youtubeVideoId: 'kffacxfA7G4', channelName: 'LCS', watched: true },
      ],
    },
  ]

  return [
    {
      date: todayStr,
      label: getDateLabel(todayStr),
      matches: todayMatches,
    },
    {
      date: yesterdayStr,
      label: getDateLabel(yesterdayStr),
      matches: yesterdayMatches,
    },
    {
      date: twoDaysAgoStr,
      label: getDateLabel(twoDaysAgoStr),
      matches: twoDaysAgoMatches,
    },
  ]
}
