import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { GameList } from '@/components/GameList'
import type { FeedGameEntry } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeGames(count: number): FeedGameEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    gameNumber: i + 1,
    youtubeVideoId: i < Math.ceil(count / 2) ? `vid-${i + 1}` : undefined,
    channelName: i < Math.ceil(count / 2) ? 'LoLEsports' : undefined,
    watched: false,
  }))
}

function bo5Games(): FeedGameEntry[] {
  return makeGames(5)
}

function bo3Games(): FeedGameEntry[] {
  return makeGames(3)
}

function bo1Games(): FeedGameEntry[] {
  return [
    { gameNumber: 1, youtubeVideoId: 'only-game', channelName: 'LCK', watched: false },
  ]
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GameList', () => {
  // ── Entry count tests ──────────────────────────────────────────────────────

  it('renders exactly 5 game entries for a Bo5', () => {
    render(<GameList games={bo5Games()} />)
    const entries = screen.getAllByTestId('game-entry')
    expect(entries).toHaveLength(5)
  })

  it('renders exactly 3 game entries for a Bo3', () => {
    render(<GameList games={bo3Games()} />)
    const entries = screen.getAllByTestId('game-entry')
    expect(entries).toHaveLength(3)
  })

  it('renders exactly 1 game entry for a Bo1', () => {
    render(<GameList games={bo1Games()} />)
    const entries = screen.getAllByTestId('game-entry')
    expect(entries).toHaveLength(1)
  })

  // ── Spoiler-safe visual identity ───────────────────────────────────────────

  it('entries WITH and WITHOUT a youtubeVideoId are visually identical', () => {
    const games: FeedGameEntry[] = [
      { gameNumber: 1, youtubeVideoId: 'real-id', channelName: 'LCK', watched: false },
      { gameNumber: 2, watched: false }, // padded / no video
    ]
    render(<GameList games={games} />)

    const entries = screen.getAllByTestId('game-entry')
    expect(entries).toHaveLength(2)

    // Both entries should have a play button
    const playButtons = screen.getAllByRole('button', { name: /watch/i })
    expect(playButtons).toHaveLength(2)

    // Neither entry should expose the video ID in its text
    entries.forEach((entry) => {
      expect(entry.textContent).not.toContain('real-id')
    })

    // The two entries should have the same CSS classes (ignoring text content)
    expect(entries[0].className).toBe(entries[1].className)
  })

  // ── Play / Watch behaviour ─────────────────────────────────────────────────

  it('calls onPlay with the youtubeVideoId when a real entry is clicked', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    const games: FeedGameEntry[] = [
      { gameNumber: 1, youtubeVideoId: 'abc123', channelName: 'LCK', watched: false },
      { gameNumber: 2, watched: false },
    ]
    render(<GameList games={games} onPlay={onPlay} />)

    const buttons = screen.getAllByRole('button', { name: /watch/i })

    // Click the real entry
    await user.click(buttons[0])
    expect(onPlay).toHaveBeenCalledWith('abc123')

    // Click the padded entry -- should NOT call onPlay
    await user.click(buttons[1])
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('opens a YouTube URL when no onPlay callback is provided and entry has a video ID', async () => {
    const user = userEvent.setup()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const games: FeedGameEntry[] = [
      { gameNumber: 1, youtubeVideoId: 'xyz789', channelName: 'LCK', watched: false },
    ]
    render(<GameList games={games} />)

    const button = screen.getByRole('button', { name: /watch/i })
    await user.click(button)

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=xyz789',
      '_blank',
    )
    openSpy.mockRestore()
  })

  // ── Watched state ──────────────────────────────────────────────────────────

  it('dims watched entries with opacity-50', () => {
    const games: FeedGameEntry[] = [
      { gameNumber: 1, youtubeVideoId: 'v1', channelName: 'LCK', watched: true },
      { gameNumber: 2, youtubeVideoId: 'v2', channelName: 'LCK', watched: false },
      { gameNumber: 3, watched: false },
    ]
    render(<GameList games={games} />)

    const entries = screen.getAllByTestId('game-entry')
    expect(entries[0].className).toMatch(/opacity-50/)
    expect(entries[1].className).not.toMatch(/opacity-50/)
    expect(entries[2].className).not.toMatch(/opacity-50/)
  })

  // ── Labels ─────────────────────────────────────────────────────────────────

  it('labels each entry as "Game 1", "Game 2", etc.', () => {
    render(<GameList games={bo5Games()} />)

    expect(screen.getByText('Game 1')).toBeInTheDocument()
    expect(screen.getByText('Game 2')).toBeInTheDocument()
    expect(screen.getByText('Game 3')).toBeInTheDocument()
    expect(screen.getByText('Game 4')).toBeInTheDocument()
    expect(screen.getByText('Game 5')).toBeInTheDocument()
  })
})
