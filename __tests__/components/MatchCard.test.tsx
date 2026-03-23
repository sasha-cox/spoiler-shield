import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MatchCard } from '@/components/MatchCard'
import type { FeedMatch } from '@/lib/types'

const match: FeedMatch = {
  id: 'match-1',
  teamA: 'T1',
  teamB: 'Gen.G',
  eventName: 'LCK Spring 2025',
  format: 'bo3',
  games: [
    { gameNumber: 1, youtubeVideoId: 'abc123', channelName: 'LCK', watched: false },
    { gameNumber: 2, youtubeVideoId: 'def456', channelName: 'LCK', watched: false },
    { gameNumber: 3, watched: false },
  ],
}

describe('MatchCard', () => {
  it('renders both team names', () => {
    render(<MatchCard match={match} />)
    // Team names appear in both abbreviated and full form
    expect(screen.getAllByText('T1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Gen.G')).toBeInTheDocument()
  })

  it('renders a "vs" divider between team names', () => {
    render(<MatchCard match={match} />)
    expect(screen.getByText('vs')).toBeInTheDocument()
  })

  it('renders the event name', () => {
    render(<MatchCard match={match} />)
    expect(screen.getByText('LCK Spring 2025')).toBeInTheDocument()
  })

  it('renders a format badge showing the match format', () => {
    render(<MatchCard match={match} />)
    expect(screen.getByText('Bo3')).toBeInTheDocument()
  })

  it('renders abbreviated team names for both teams', () => {
    render(<MatchCard match={match} />)
    const container = screen.getByTestId('match-card')
    // T1 is short enough to be used as-is, Gen.G abbreviates to GEN
    expect(container.textContent).toContain('T1')
    expect(container.textContent).toContain('GEN')
  })

  it('does NOT render any duration or timestamp text', () => {
    render(<MatchCard match={match} />)
    // Durations typically look like "12:34" or "1:23:45"
    const container = screen.getByTestId('match-card')
    expect(container.textContent).not.toMatch(/\d+:\d{2}/)
    // No "ago" text (e.g., "2 hours ago")
    expect(container.textContent).not.toMatch(/ago/i)
  })

  it('does NOT render any YouTube thumbnail images', () => {
    render(<MatchCard match={match} />)
    const images = screen.queryAllByRole('img')
    images.forEach((img) => {
      expect(img.getAttribute('src')).not.toMatch(/ytimg|youtube/i)
    })
  })

  it('does NOT render any YouTube video title', () => {
    render(<MatchCard match={match} />)
    // YouTube video IDs from test data should not appear as visible text
    const container = screen.getByTestId('match-card')
    expect(container.textContent).not.toContain('abc123')
    expect(container.textContent).not.toContain('def456')
  })

  it('does NOT render the number of games played', () => {
    render(<MatchCard match={match} />)
    const container = screen.getByTestId('match-card')
    // Should not reveal how many games were actually played (spoiler)
    expect(container.textContent).not.toMatch(/\bgames?\b/i)
    expect(container.textContent).not.toMatch(/\b[1-5]\s*\/\s*[1-5]\b/)
  })

  it('renders format badge for bo1 format', () => {
    const bo1Match: FeedMatch = {
      ...match,
      id: 'match-bo1',
      format: 'bo1',
      games: [{ gameNumber: 1, youtubeVideoId: 'xyz', channelName: 'LCK', watched: false }],
    }
    render(<MatchCard match={bo1Match} />)
    expect(screen.getByText('Bo1')).toBeInTheDocument()
  })

  it('renders format badge for bo5 format', () => {
    const bo5Match: FeedMatch = {
      ...match,
      id: 'match-bo5',
      format: 'bo5',
      games: Array.from({ length: 5 }, (_, i) => ({
        gameNumber: i + 1,
        watched: false,
      })),
    }
    render(<MatchCard match={bo5Match} />)
    expect(screen.getByText('Bo5')).toBeInTheDocument()
  })
})
