import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MatchFeed } from '@/components/MatchFeed'
import type { FeedDay } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFeedDays(): FeedDay[] {
  return [
    {
      date: '2025-03-22',
      label: 'Today',
      matches: [
        {
          id: 'match-1',
          teamA: 'T1',
          teamB: 'Gen.G',
          eventName: 'LCK Spring 2025',
          format: 'bo3',
          games: [
            { gameNumber: 1, youtubeVideoId: 'abc', channelName: 'LCK', watched: false },
            { gameNumber: 2, youtubeVideoId: 'def', channelName: 'LCK', watched: false },
            { gameNumber: 3, watched: false },
          ],
        },
        {
          id: 'match-2',
          teamA: 'DRX',
          teamB: 'KT',
          eventName: 'LCK Spring 2025',
          format: 'bo3',
          games: [
            { gameNumber: 1, youtubeVideoId: 'ghi', channelName: 'LCK', watched: false },
            { gameNumber: 2, youtubeVideoId: 'jkl', channelName: 'LCK', watched: false },
            { gameNumber: 3, watched: false },
          ],
        },
      ],
    },
    {
      date: '2025-03-21',
      label: 'Yesterday',
      matches: [
        {
          id: 'match-3',
          teamA: 'G2',
          teamB: 'FNC',
          eventName: 'LEC Winter 2025',
          format: 'bo5',
          games: [
            { gameNumber: 1, youtubeVideoId: 'mno', channelName: 'LEC', watched: false },
            { gameNumber: 2, youtubeVideoId: 'pqr', channelName: 'LEC', watched: false },
            { gameNumber: 3, youtubeVideoId: 'stu', channelName: 'LEC', watched: false },
            { gameNumber: 4, watched: false },
            { gameNumber: 5, watched: false },
          ],
        },
      ],
    },
    {
      date: '2025-03-20',
      label: 'March 20',
      matches: [
        {
          id: 'match-4',
          teamA: 'C9',
          teamB: 'TL',
          eventName: 'LCS Spring 2025',
          format: 'bo1',
          games: [
            { gameNumber: 1, youtubeVideoId: 'vwx', channelName: 'LCS', watched: false },
          ],
        },
      ],
    },
  ]
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MatchFeed', () => {
  it('renders day headers for each FeedDay', () => {
    render(<MatchFeed days={makeFeedDays()} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    expect(screen.getByText('March 20')).toBeInTheDocument()
  })

  it('renders a MatchCard for each match within each day', () => {
    render(<MatchFeed days={makeFeedDays()} />)

    // 4 total matches across the 3 days
    const matchCards = screen.getAllByTestId('match-card')
    expect(matchCards).toHaveLength(4)

    // Verify specific team names appear
    expect(screen.getByText('T1')).toBeInTheDocument()
    expect(screen.getByText('Gen.G')).toBeInTheDocument()
    expect(screen.getByText('DRX')).toBeInTheDocument()
    expect(screen.getByText('KT')).toBeInTheDocument()
    expect(screen.getByText('G2')).toBeInTheDocument()
    expect(screen.getByText('FNC')).toBeInTheDocument()
    expect(screen.getByText('C9')).toBeInTheDocument()
    expect(screen.getByText('TL')).toBeInTheDocument()
  })

  it('renders GameList entries for each match', () => {
    render(<MatchFeed days={makeFeedDays()} />)

    // match-1: 3 games, match-2: 3 games, match-3: 5 games, match-4: 1 game = 12 total
    const gameEntries = screen.getAllByTestId('game-entry')
    expect(gameEntries).toHaveLength(12)
  })

  it('shows "No VODs ready yet" empty state when feed has no data', () => {
    render(<MatchFeed days={[]} />)

    expect(screen.getByText('No VODs ready yet')).toBeInTheDocument()
    expect(screen.queryAllByTestId('match-card')).toHaveLength(0)
  })

  it('renders days in the order provided (reverse chronological)', () => {
    const { container } = render(<MatchFeed days={makeFeedDays()} />)

    const daySections = container.querySelectorAll('[data-testid="feed-day"]')
    expect(daySections).toHaveLength(3)

    // Check that day headers appear in the order provided
    expect(within(daySections[0] as HTMLElement).getByText('Today')).toBeInTheDocument()
    expect(within(daySections[1] as HTMLElement).getByText('Yesterday')).toBeInTheDocument()
    expect(within(daySections[2] as HTMLElement).getByText('March 20')).toBeInTheDocument()
  })

  it('renders day headers with sticky positioning', () => {
    const { container } = render(<MatchFeed days={makeFeedDays()} />)

    const dayHeaders = container.querySelectorAll('[data-testid="day-header"]')
    expect(dayHeaders).toHaveLength(3)

    dayHeaders.forEach((header) => {
      expect(header.className).toMatch(/sticky/)
    })
  })
})
