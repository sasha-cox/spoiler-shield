'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Search, Star, Eye, EyeOff, X } from 'lucide-react'
import type { FeedFilters, FilterAction, FeedFormat } from '@/lib/types'
import type { Region } from '@/lib/regions'

interface FilterBarProps {
  channels: string[]
  regions: Region[]
  formats: FeedFormat[]
  filters: FeedFilters
  onFilterChange: (action: FilterAction) => void
  followedTeams: Set<string>
  teamNames: string[]
  onFollowTeam: (team: string) => void
  onUnfollowTeam: (team: string) => void
}

export function FilterBar({
  channels,
  regions,
  formats,
  filters,
  onFilterChange,
  followedTeams,
  teamNames,
  onFollowTeam,
  onUnfollowTeam,
}: FilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value)
    if (value.trim().length < 2) {
      setSearchResults([])
      return
    }
    const lower = value.toLowerCase()
    setSearchResults(
      teamNames.filter(name => name.toLowerCase().includes(lower)).slice(0, 8)
    )
  }, [teamNames])

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const pillBase = 'shrink-0 rounded-full transition-colors text-xs h-7 px-3'
  const pillInactive = 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-transparent'
  const pillActiveGold = 'bg-gold text-black border-gold hover:bg-[#e0b84d] hover:text-black'

  return (
    <div className="flex flex-col gap-2">
      {/* Channel filters */}
      <div className="overflow-x-auto flex gap-1.5 scrollbar-none">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({ type: 'SET_CHANNEL', channel: null })}
          aria-pressed={filters.channel === null}
          className={cn(pillBase, filters.channel === null ? pillActiveGold : pillInactive)}
        >
          All
        </Button>
        {channels.map((channel) => (
          <Button
            key={channel}
            variant="outline"
            size="sm"
            onClick={() => onFilterChange({ type: 'SET_CHANNEL', channel })}
            aria-pressed={filters.channel === channel}
            className={cn(pillBase, filters.channel === channel ? pillActiveGold : pillInactive)}
          >
            {channel}
          </Button>
        ))}
      </div>

      {/* Region + Format + Actions row */}
      <div className="overflow-x-auto flex gap-1.5 items-center scrollbar-none">
        {/* Region pills */}
        {regions.map((region) => {
          const isActive = filters.regions.has(region.id)
          return (
            <Button
              key={region.id}
              variant="outline"
              size="sm"
              onClick={() => onFilterChange({ type: 'TOGGLE_REGION', region: region.id })}
              aria-pressed={isActive}
              aria-label={`Filter by ${region.name}`}
              className={cn(
                pillBase,
                isActive
                  ? 'text-white border-current'
                  : pillInactive
              )}
              style={isActive ? { backgroundColor: `${region.color}25`, borderColor: region.color, color: region.color } : undefined}
            >
              {region.flag} {region.shortCode}
            </Button>
          )
        })}

        <span className="w-px h-5 bg-zinc-700 shrink-0" />

        {/* Format pills */}
        {formats.map((fmt) => {
          const isActive = filters.formats.has(fmt)
          const label = fmt === 'bo1' ? 'Bo1' : fmt === 'bo3' ? 'Bo3' : 'Bo5'
          return (
            <Button
              key={fmt}
              variant="outline"
              size="sm"
              onClick={() => onFilterChange({ type: 'TOGGLE_FORMAT', format: fmt })}
              aria-pressed={isActive}
              className={cn(pillBase, isActive ? pillActiveGold : pillInactive)}
            >
              {label}
            </Button>
          )
        })}

        <span className="w-px h-5 bg-zinc-700 shrink-0" />

        {/* Hide watched toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({ type: 'TOGGLE_HIDE_WATCHED' })}
          aria-pressed={filters.hideWatched}
          className={cn(pillBase, filters.hideWatched ? pillActiveGold : pillInactive)}
        >
          {filters.hideWatched ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {filters.hideWatched ? 'Hiding watched' : 'Hide watched'}
        </Button>

        {/* Search toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchOpen(!searchOpen)
            if (searchOpen) {
              setSearchInput('')
              setSearchResults([])
              onFilterChange({ type: 'SET_SEARCH', query: '' })
            }
          }}
          aria-pressed={searchOpen}
          className={cn(pillBase, searchOpen || filters.searchQuery ? pillActiveGold : pillInactive)}
        >
          <Search className="size-3.5" />
        </Button>
      </div>

      {/* Search input + dropdown */}
      {searchOpen && (
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
            <Search className="size-3.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                handleSearchInput(e.target.value)
                onFilterChange({ type: 'SET_SEARCH', query: e.target.value })
              }}
              placeholder="Search teams..."
              className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none flex-1 min-w-0"
              autoFocus
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearchResults([])
                  onFilterChange({ type: 'SET_SEARCH', query: '' })
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1 z-20 max-h-48 overflow-y-auto">
              {searchResults.map((team) => {
                const followed = followedTeams.has(team)
                return (
                  <button
                    key={team}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-left hover:bg-zinc-800 transition-colors"
                    onClick={() => followed ? onUnfollowTeam(team) : onFollowTeam(team)}
                  >
                    <span className="text-zinc-200">{team}</span>
                    <Star
                      className={cn(
                        'size-3.5 shrink-0',
                        followed ? 'text-gold fill-gold' : 'text-zinc-600'
                      )}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Followed teams display */}
      {followedTeams.size > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[...followedTeams].map((team) => (
            <button
              key={team}
              onClick={() => onUnfollowTeam(team)}
              className="flex items-center gap-1 rounded-full bg-gold/10 border border-gold/20 px-2 py-0.5 text-xs text-gold hover:bg-gold/20 transition-colors"
            >
              <Star className="size-3 fill-gold" />
              {team}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
