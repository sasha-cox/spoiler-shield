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

  const pillBase =
    'shrink-0 rounded-full transition-colors text-[11px] font-display font-semibold uppercase tracking-[0.12em] h-7 px-3'
  const pillInactive =
    'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 bg-zinc-950/60'
  const pillActiveGold =
    'bg-gold text-black border-gold hover:bg-[#e0b84d] hover:text-black shadow-[0_0_12px_-2px_rgba(212,168,67,0.5)]'

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <div className="overflow-x-auto flex gap-1.5 scrollbar-none pr-4">
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
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0a0a0a] to-transparent"
        />
      </div>

      <div className="relative">
        <div className="overflow-x-auto flex gap-1.5 items-center scrollbar-none pr-4">
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
                  'gap-1.5',
                  isActive ? 'border-current text-white' : pillInactive,
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${region.color}1f`,
                        borderColor: region.color,
                        color: region.color,
                        boxShadow: `0 0 10px -3px ${region.color}55`,
                      }
                    : undefined
                }
              >
                <span aria-hidden className="text-[13px] leading-none">{region.flag}</span>
                {region.label}
              </Button>
            )
          })}

          {formats.length > 0 && (
            <span className="w-px h-4 bg-zinc-800 shrink-0 mx-0.5" aria-hidden />
          )}

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

          <span className="w-px h-4 bg-zinc-800 shrink-0 mx-0.5" aria-hidden />

          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterChange({ type: 'TOGGLE_HIDE_WATCHED' })}
            aria-pressed={filters.hideWatched}
            className={cn(pillBase, 'gap-1.5', filters.hideWatched ? pillActiveGold : pillInactive)}
          >
            {filters.hideWatched ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            {filters.hideWatched ? 'Hidden' : 'Hide watched'}
          </Button>

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
            aria-label="Search teams"
            className={cn(
              pillBase,
              'aspect-square px-0',
              searchOpen || filters.searchQuery ? pillActiveGold : pillInactive,
            )}
          >
            <Search className="size-3.5" />
          </Button>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0a0a0a] to-transparent"
        />
      </div>

      {searchOpen && (
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-gold/20 bg-zinc-950 px-3 py-2 ring-1 ring-gold/10 focus-within:ring-gold/30 transition-shadow">
            <Search className="size-3.5 text-gold/70 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                handleSearchInput(e.target.value)
                onFilterChange({ type: 'SET_SEARCH', query: e.target.value })
              }}
              placeholder="Search and follow teams..."
              className="bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none flex-1 min-w-0"
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
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-1 z-20 max-h-56 overflow-y-auto shadow-xl shadow-black/50">
              {searchResults.map((team) => {
                const followed = followedTeams.has(team)
                return (
                  <button
                    key={team}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-zinc-900/80 transition-colors"
                    onClick={() => followed ? onUnfollowTeam(team) : onFollowTeam(team)}
                  >
                    <span className="text-zinc-200">{team}</span>
                    <Star
                      className={cn(
                        'size-3.5 shrink-0 transition-colors',
                        followed ? 'text-gold fill-gold' : 'text-zinc-700 hover:text-zinc-500',
                      )}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {followedTeams.size > 0 && (
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="font-display text-[10px] uppercase tracking-[0.22em] text-zinc-600 pr-1">
            Following
          </span>
          {[...followedTeams].map((team) => (
            <button
              key={team}
              onClick={() => onUnfollowTeam(team)}
              className="group flex items-center gap-1 rounded-full bg-gold/10 border border-gold/25 px-2 py-0.5 text-xs text-gold hover:bg-gold/20 hover:border-gold/40 transition-colors"
              aria-label={`Unfollow ${team}`}
            >
              <Star className="size-3 fill-gold" />
              {team}
              <X className="size-3 text-gold/60 group-hover:text-gold transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
