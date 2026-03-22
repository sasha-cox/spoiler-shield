import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FilterBar } from '@/components/FilterBar'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FilterBar', () => {
  const channels = ['LCK', 'LEC', 'LCS']

  it('renders an "All" button plus one button per channel name', () => {
    render(
      <FilterBar channels={channels} activeFilter={null} onFilterChange={() => {}} />
    )

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LCK' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LEC' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LCS' })).toBeInTheDocument()

    // Total: 4 buttons (All + 3 channels)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
  })

  it('clicking a channel button fires onFilterChange with the channel name', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()

    render(
      <FilterBar channels={channels} activeFilter={null} onFilterChange={onFilterChange} />
    )

    await user.click(screen.getByRole('button', { name: 'LEC' }))
    expect(onFilterChange).toHaveBeenCalledWith('LEC')
    expect(onFilterChange).toHaveBeenCalledTimes(1)
  })

  it('clicking the "All" button fires onFilterChange with null', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()

    render(
      <FilterBar channels={channels} activeFilter="LCK" onFilterChange={onFilterChange} />
    )

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(onFilterChange).toHaveBeenCalledWith(null)
    expect(onFilterChange).toHaveBeenCalledTimes(1)
  })

  it('highlights the active filter with accent classes and dims inactive pills', () => {
    render(
      <FilterBar channels={channels} activeFilter="LCK" onFilterChange={() => {}} />
    )

    const allButton = screen.getByRole('button', { name: 'All' })
    const lckButton = screen.getByRole('button', { name: 'LCK' })
    const lecButton = screen.getByRole('button', { name: 'LEC' })

    // Active pill (LCK) should have accent styling
    expect(lckButton.className).toMatch(/bg-blue-600/)
    expect(lckButton.className).toMatch(/text-white/)

    // Inactive pills should have muted styling
    expect(allButton.className).toMatch(/bg-zinc-800/)
    expect(allButton.className).toMatch(/text-zinc-400/)
    expect(lecButton.className).toMatch(/bg-zinc-800/)
    expect(lecButton.className).toMatch(/text-zinc-400/)
  })

  it('highlights "All" when activeFilter is null', () => {
    render(
      <FilterBar channels={channels} activeFilter={null} onFilterChange={() => {}} />
    )

    const allButton = screen.getByRole('button', { name: 'All' })
    const lckButton = screen.getByRole('button', { name: 'LCK' })

    // "All" should be active
    expect(allButton.className).toMatch(/bg-blue-600/)
    expect(allButton.className).toMatch(/text-white/)

    // Channel buttons should be inactive
    expect(lckButton.className).toMatch(/bg-zinc-800/)
    expect(lckButton.className).toMatch(/text-zinc-400/)
  })

  it('has horizontal scroll overflow for mobile', () => {
    const { container } = render(
      <FilterBar channels={channels} activeFilter={null} onFilterChange={() => {}} />
    )

    const scrollContainer = container.firstElementChild as HTMLElement
    expect(scrollContainer.className).toMatch(/overflow-x-auto/)
  })
})
