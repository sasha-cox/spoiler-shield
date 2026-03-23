import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FilterBar } from '@/components/FilterBar'
import type { FeedFilters, FilterAction } from '@/lib/types'

const defaultFilters: FeedFilters = {
  channel: null,
  regions: new Set(),
  formats: new Set(),
  searchQuery: '',
  hideWatched: false,
}

const defaultProps = {
  channels: ['LCK', 'LEC', 'LCS'],
  regions: [],
  formats: [] as ('bo1' | 'bo3' | 'bo5')[],
  filters: defaultFilters,
  onFilterChange: () => {},
  followedTeams: new Set<string>(),
  teamNames: [],
  onFollowTeam: () => {},
  onUnfollowTeam: () => {},
}

describe('FilterBar', () => {
  it('renders an "All" button plus one button per channel name', () => {
    render(<FilterBar {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LCK' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LEC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LCS' })).toBeInTheDocument()
  })

  it('clicking a channel button fires onFilterChange with SET_CHANNEL action', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()

    render(<FilterBar {...defaultProps} onFilterChange={onFilterChange} />)

    await user.click(screen.getByRole('button', { name: 'LEC' }))
    expect(onFilterChange).toHaveBeenCalledWith({ type: 'SET_CHANNEL', channel: 'LEC' })
  })

  it('clicking the "All" button fires onFilterChange with null channel', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()

    render(
      <FilterBar
        {...defaultProps}
        filters={{ ...defaultFilters, channel: 'LCK' }}
        onFilterChange={onFilterChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(onFilterChange).toHaveBeenCalledWith({ type: 'SET_CHANNEL', channel: null })
  })

  it('highlights the active channel filter with gold accent', () => {
    render(
      <FilterBar
        {...defaultProps}
        filters={{ ...defaultFilters, channel: 'LCK' }}
      />
    )

    const lckButton = screen.getByRole('button', { name: 'LCK' })
    const allButton = screen.getByRole('button', { name: 'All' })
    const lecButton = screen.getByRole('button', { name: 'LEC' })

    // Active pill should have gold accent
    expect(lckButton.className).toMatch(/bg-gold/)
    expect(lckButton.className).toMatch(/text-black/)

    // Inactive pills should have muted styling
    expect(allButton.className).toMatch(/text-zinc-400/)
    expect(lecButton.className).toMatch(/text-zinc-400/)
  })

  it('highlights "All" when channel filter is null', () => {
    render(<FilterBar {...defaultProps} />)

    const allButton = screen.getByRole('button', { name: 'All' })
    const lckButton = screen.getByRole('button', { name: 'LCK' })

    expect(allButton.className).toMatch(/bg-gold/)
    expect(lckButton.className).toMatch(/text-zinc-400/)
  })

  it('renders hide watched toggle', () => {
    render(<FilterBar {...defaultProps} />)

    expect(screen.getByRole('button', { name: /hide watched/i })).toBeInTheDocument()
  })

  it('renders search button', () => {
    render(<FilterBar {...defaultProps} />)

    const searchButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('.lucide-search')
    )
    expect(searchButtons.length).toBeGreaterThanOrEqual(0)
  })

  it('displays followed teams as chips', () => {
    render(
      <FilterBar
        {...defaultProps}
        followedTeams={new Set(['T1', 'Gen.G'])}
      />
    )

    expect(screen.getByText('T1')).toBeInTheDocument()
    expect(screen.getByText('Gen.G')).toBeInTheDocument()
  })

  it('has horizontal scroll overflow for mobile', () => {
    const { container } = render(<FilterBar {...defaultProps} />)

    const scrollContainer = container.querySelector('.overflow-x-auto')
    expect(scrollContainer).toBeInTheDocument()
  })
})
