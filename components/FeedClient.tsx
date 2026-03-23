'use client'

import { useState, useCallback, useMemo, useEffect, useReducer } from 'react'
import { signOut } from 'next-auth/react'
import { FilterBar } from '@/components/FilterBar'
import { MatchFeed } from '@/components/MatchFeed'
import { markWatched, getWatchedVods } from '@/lib/watched-store'
import { followTeam, unfollowTeam, getFollowedTeams } from '@/lib/follow-store'
import { REGIONS } from '@/lib/regions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Shield, RefreshCw, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedDay, FeedFilters, FilterAction, FeedFormat } from '@/lib/types'

// ── Filter state ────────────────────────────────────────────────────────

const initialFilters: FeedFilters = {
  channel: null,
  regions: new Set(),
  formats: new Set(),
  searchQuery: '',
  hideWatched: false,
}

function filterReducer(state: FeedFilters, action: FilterAction): FeedFilters {
  switch (action.type) {
    case 'SET_CHANNEL':
      return { ...state, channel: action.channel }
    case 'TOGGLE_REGION': {
      const next = new Set(state.regions)
      next.has(action.region) ? next.delete(action.region) : next.add(action.region)
      return { ...state, regions: next }
    }
    case 'TOGGLE_FORMAT': {
      const next = new Set(state.formats)
      next.has(action.format) ? next.delete(action.format) : next.add(action.format)
      return { ...state, formats: next }
    }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query }
    case 'TOGGLE_HIDE_WATCHED':
      return { ...state, hideWatched: !state.hideWatched }
    case 'RESET':
      return initialFilters
    default:
      return state
  }
}

// ── Helper functions ────────────────────────────────────────────────────

function applyWatchedState(days: FeedDay[], watched: Set<string>): FeedDay[] {
  return days.map((day) => ({
    ...day,
    matches: day.matches.map((match) => ({
      ...match,
      watched: match.youtubeVideoId
        ? watched.has(match.youtubeVideoId)
        : match.watched,
    })),
  }))
}

function extractChannels(days: FeedDay[]): string[] {
  const set = new Set<string>()
  for (const day of days) {
    for (const match of day.matches) {
      if (match.channelName) set.add(match.channelName)
    }
  }
  return [...set].sort()
}

function extractFormats(days: FeedDay[]): FeedFormat[] {
  const set = new Set<FeedFormat>()
  for (const day of days) {
    for (const match of day.matches) {
      set.add(match.format)
    }
  }
  const order: FeedFormat[] = ['bo1', 'bo3', 'bo5']
  return order.filter(f => set.has(f))
}

function extractTeamNames(days: FeedDay[]): string[] {
  const set = new Set<string>()
  for (const day of days) {
    for (const match of day.matches) {
      set.add(match.teamA)
      set.add(match.teamB)
    }
  }
  return [...set].sort()
}

function filterDays(days: FeedDay[], filters: FeedFilters): FeedDay[] {
  return days
    .map((day) => ({
      ...day,
      matches: day.matches.filter((match) => {
        // Channel filter
        if (filters.channel && match.channelName !== filters.channel) return false
        // Region filter (multi-select: show if match region is in selected set)
        if (filters.regions.size > 0 && match.region && !filters.regions.has(regionIdFromShortCode(match.region))) return false
        // Format filter
        if (filters.formats.size > 0 && !filters.formats.has(match.format)) return false
        // Search filter
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase()
          if (!match.teamA.toLowerCase().includes(q) && !match.teamB.toLowerCase().includes(q)) return false
        }
        // Hide watched
        if (filters.hideWatched && match.watched) return false
        return true
      }),
    }))
    .filter((day) => day.matches.length > 0)
}

// Map region short codes (LCK, LEC, etc.) back to region IDs (KR, EU, etc.)
function regionIdFromShortCode(shortCode: string): string {
  for (const [id, region] of Object.entries(REGIONS)) {
    if (region.shortCode === shortCode) return id
  }
  return shortCode
}

// ── Component ───────────────────────────────────────────────────────────

export function FeedClient({ initialFeed, userName, userEmail, userImage }: { initialFeed: FeedDay[]; userName?: string; userEmail?: string; userImage?: string }) {
  const [rawFeed, setRawFeed] = useState<FeedDay[]>(initialFeed)
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set())
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set())
  const [filters, dispatch] = useReducer(filterReducer, initialFilters)
  const [refreshError, setRefreshError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Hydrate client state after mount to avoid SSR mismatch
  useEffect(() => {
    setWatchedSet(getWatchedVods())
    setFollowedSet(getFollowedTeams())
  }, [])

  const channels = useMemo(() => extractChannels(rawFeed), [rawFeed])
  const availableFormats = useMemo(() => extractFormats(rawFeed), [rawFeed])
  const teamNames = useMemo(() => extractTeamNames(rawFeed), [rawFeed])
  const availableRegions = useMemo(() => {
    const regionIds = new Set<string>()
    for (const day of rawFeed) {
      for (const match of day.matches) {
        if (match.region) regionIds.add(regionIdFromShortCode(match.region))
      }
    }
    return Object.values(REGIONS).filter(r => regionIds.has(r.id))
  }, [rawFeed])

  const feedWithWatched = useMemo(
    () => applyWatchedState(rawFeed, watchedSet),
    [rawFeed, watchedSet],
  )

  const filteredFeed = useMemo(
    () => filterDays(feedWithWatched, filters),
    [feedWithWatched, filters],
  )

  const handlePlay = useCallback(
    (youtubeVideoId: string) => {
      markWatched(youtubeVideoId)
      setWatchedSet(getWatchedVods())
    },
    [],
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setRefreshError(false)
    try {
      const res = await fetch('/api/feed')
      if (res.ok) {
        const data = await res.json()
        setRawFeed(data)
      } else {
        setRefreshError(true)
      }
    } catch {
      setRefreshError(true)
    } finally {
      setIsRefreshing(false)
    }
    setWatchedSet(getWatchedVods())
  }, [])

  const handleFollowTeam = useCallback((team: string) => {
    followTeam(team)
    setFollowedSet(getFollowedTeams())
  }, [])

  const handleUnfollowTeam = useCallback((team: string) => {
    unfollowTeam(team)
    setFollowedSet(getFollowedTeams())
  }, [])

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
      <header className="flex items-center justify-between px-4 py-4 border-b border-gold/20">
        <div className="flex items-center gap-2">
          <Shield className="size-6 text-gold" />
          <h1 className="font-display text-2xl font-bold text-gold">
            Spoiler Shield
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh feed"
            className="text-zinc-400 hover:text-white"
          >
            <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <div className="flex items-center gap-2 rounded-full bg-surface-border pl-1 pr-2 py-1">
            <Avatar size="sm">
              {userImage ? (
                <AvatarImage src={userImage} alt={userName ?? ''} referrerPolicy="no-referrer" />
              ) : null}
              <AvatarFallback className="bg-zinc-700 text-white text-[10px]">
                {userName?.charAt(0)?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-zinc-300 max-w-[120px] truncate hidden sm:inline">
              {userEmail ?? userName ?? 'User'}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="Sign out"
              className="text-zinc-500 hover:text-white"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-3">
        <FilterBar
          channels={channels}
          regions={availableRegions}
          formats={availableFormats}
          filters={filters}
          onFilterChange={dispatch}
          followedTeams={followedSet}
          teamNames={teamNames}
          onFollowTeam={handleFollowTeam}
          onUnfollowTeam={handleUnfollowTeam}
        />
      </div>

      {refreshError && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">
          Failed to refresh feed. Please try again.
        </div>
      )}

      <main className="flex-1 px-4 py-4" aria-live="polite">
        <MatchFeed days={filteredFeed} onPlay={handlePlay} followedTeams={followedSet} />
      </main>

    </div>
  )
}
