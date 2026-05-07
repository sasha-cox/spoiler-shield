'use client'

import { useState, useCallback, useMemo, useEffect, useReducer } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { FilterBar } from '@/components/FilterBar'
import { MatchFeed } from '@/components/MatchFeed'
import { markWatched, getWatchedVods } from '@/lib/watched-store'
import { followTeam, unfollowTeam, getFollowedTeams } from '@/lib/follow-store'
import { REGIONS } from '@/lib/regions'
import { MONITORED_BRANDS } from '@/lib/config'
import { leagueBySlug } from '@/lib/leagues'
import { getPreferences, savePreferences, type Preferences } from '@/lib/preferences-store'
import { SettingsModal } from '@/components/SettingsModal'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Shield, RefreshCw, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedDay, FeedFilters, FilterAction, FeedFormat } from '@/lib/types'

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

const ALL_BRANDS: string[] = MONITORED_BRANDS
const ALL_REGIONS = Object.values(REGIONS)

/**
 * Apply user subscription preferences to the feed: drop matches whose brand,
 * league, or region the user has hidden in settings. Runs before the in-
 * session FilterBar narrowing.
 */
function applyPreferences(days: FeedDay[], prefs: Preferences): FeedDay[] {
  if (
    prefs.hiddenBrands.size === 0 &&
    prefs.hiddenLeagues.size === 0 &&
    prefs.hiddenRegions.size === 0
  ) {
    return days
  }
  return days
    .map((day) => ({
      ...day,
      matches: day.matches.filter((match) => {
        if (match.channelName && prefs.hiddenBrands.has(match.channelName)) return false
        if (match.region && prefs.hiddenRegions.has(match.region)) return false
        // We don't carry leagueSlug on FeedMatch, but the league name is in the
        // event name. Best-effort: match by region label since each league
        // has a distinct primary label per region.
        for (const slug of prefs.hiddenLeagues) {
          const league = leagueBySlug(slug)
          if (league && match.eventName.toUpperCase().includes(league.name.toUpperCase())) return false
        }
        return true
      }),
    }))
    .filter((day) => day.matches.length > 0)
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
        if (filters.channel && match.channelName !== filters.channel) return false
        if (filters.regions.size > 0 && match.region && !filters.regions.has(match.region)) return false
        if (filters.formats.size > 0 && !filters.formats.has(match.format)) return false
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase()
          if (!match.teamA.toLowerCase().includes(q) && !match.teamB.toLowerCase().includes(q)) return false
        }
        if (filters.hideWatched && match.watched) return false
        return true
      }),
    }))
    .filter((day) => day.matches.length > 0)
}


export function FeedClient({ initialFeed, userName, userEmail, userImage }: { initialFeed: FeedDay[]; userName?: string; userEmail?: string; userImage?: string }) {
  const [rawFeed, setRawFeed] = useState<FeedDay[]>(initialFeed)
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set())
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set())
  const [filters, dispatch] = useReducer(filterReducer, initialFilters)
  const [refreshError, setRefreshError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    hiddenBrands: new Set(),
    hiddenLeagues: new Set(),
    hiddenRegions: new Set(),
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setWatchedSet(getWatchedVods())
    setFollowedSet(getFollowedTeams())
    setPreferences(getPreferences())
  }, [])

  const handlePreferencesChange = useCallback((next: Preferences) => {
    setPreferences(next)
    savePreferences(next)
  }, [])

  const subscribedFeed = useMemo(
    () => applyPreferences(rawFeed, preferences),
    [rawFeed, preferences],
  )

  const availableFormats = useMemo(() => extractFormats(subscribedFeed), [subscribedFeed])
  const teamNames = useMemo(() => extractTeamNames(subscribedFeed), [subscribedFeed])

  const feedWithWatched = useMemo(
    () => applyWatchedState(subscribedFeed, watchedSet),
    [subscribedFeed, watchedSet],
  )

  const filteredFeed = useMemo(
    () => filterDays(feedWithWatched, filters),
    [feedWithWatched, filters],
  )

  const hasFeedContent = rawFeed.some((d) => d.matches.length > 0)
  const emptyMessage = !hasFeedContent
    ? undefined
    : filters.channel
      ? `No ${filters.channel} matches in the current feed`
      : filters.regions.size > 0 || filters.formats.size > 0 || filters.searchQuery || filters.hideWatched
        ? 'No matches match your filters'
        : undefined

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
    <div className="relative flex flex-col flex-1 max-w-lg mx-auto w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(212,168,67,0.08),transparent_70%)]"
      />

      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-gold/10">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />
        <div className="flex items-center justify-between px-4 py-3.5">
          <Link href="/" className="group flex items-center gap-2.5 min-w-0">
            <span className="relative flex items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gold/20 blur-md group-hover:bg-gold/30 transition-colors"
              />
              <Shield
                className="relative size-6 text-gold drop-shadow-[0_0_6px_rgba(212,168,67,0.5)]"
                strokeWidth={2}
              />
            </span>
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.18em] leading-none">
              <span className="text-white">Spoiler</span>
              <span className="text-gold">Shield</span>
            </h1>
          </Link>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh feed"
              className="text-zinc-500 hover:text-gold hover:bg-gold/10"
            >
              <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSettingsOpen(true)}
              aria-label="Subscriptions"
              className="text-zinc-500 hover:text-gold hover:bg-gold/10"
            >
              <Settings className="size-4" />
            </Button>

            <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 pl-1 pr-1 py-0.5">
              <Avatar size="sm" className="ring-1 ring-gold/30">
                {userImage ? (
                  <AvatarImage src={userImage} alt={userName ?? ''} referrerPolicy="no-referrer" />
                ) : null}
                <AvatarFallback className="bg-zinc-800 text-gold text-[10px] font-bold">
                  {userName?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-zinc-400 max-w-[110px] truncate hidden sm:inline">
                {userName ?? userEmail ?? 'User'}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => signOut({ callbackUrl: '/login' })}
                aria-label="Sign out"
                className="text-zinc-600 hover:text-gold hover:bg-transparent"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        onChange={handlePreferencesChange}
      />

      <div className="relative px-4 pt-4">
        <FilterBar
          channels={ALL_BRANDS}
          regions={ALL_REGIONS}
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
        <div className="mx-4 mt-3 px-3 py-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          Failed to refresh feed. Please try again.
        </div>
      )}

      <main className="relative flex-1 px-4 py-5" aria-live="polite">
        <MatchFeed
          days={filteredFeed}
          onPlay={handlePlay}
          followedTeams={followedSet}
          emptyMessage={emptyMessage}
        />
      </main>
    </div>
  )
}
