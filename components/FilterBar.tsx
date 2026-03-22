interface FilterBarProps {
  channels: string[]
  activeFilter: string | null
  onFilterChange: (channel: string | null) => void
}

export function FilterBar({ channels, activeFilter, onFilterChange }: FilterBarProps) {
  const activeClasses = 'bg-[#D4A843] text-black'
  const inactiveClasses = 'bg-[#1a1a1a] text-[#8A8A8A] hover:bg-[#252525] hover:text-white'

  return (
    <div className="overflow-x-auto flex gap-2 py-2 scrollbar-none">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          activeFilter === null ? activeClasses : inactiveClasses
        }`}
      >
        All
      </button>

      {channels.map((channel) => (
        <button
          key={channel}
          type="button"
          onClick={() => onFilterChange(channel)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeFilter === channel ? activeClasses : inactiveClasses
          }`}
        >
          {channel}
        </button>
      ))}
    </div>
  )
}
