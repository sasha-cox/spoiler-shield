'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  channels: string[]
  activeFilter: string | null
  onFilterChange: (channel: string | null) => void
}

export function FilterBar({ channels, activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="overflow-x-auto flex gap-2 py-2 scrollbar-none">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onFilterChange(null)}
        className={cn(
          'shrink-0 rounded-full transition-colors',
          activeFilter === null
            ? 'bg-gold text-black border-gold hover:bg-[#e0b84d] hover:text-black'
            : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent'
        )}
      >
        All
      </Button>

      {channels.map((channel) => (
        <Button
          key={channel}
          variant="outline"
          size="sm"
          onClick={() => onFilterChange(channel)}
          className={cn(
            'shrink-0 rounded-full transition-colors',
            activeFilter === channel
              ? 'bg-gold text-black border-gold hover:bg-[#e0b84d] hover:text-black'
              : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent'
          )}
        >
          {channel}
        </Button>
      ))}
    </div>
  )
}
