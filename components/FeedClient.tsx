'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { FilterBar } from '@/components/FilterBar'
import { MatchFeed } from '@/components/MatchFeed'
import { markWatched, getWatchedVods } from '@/lib/watched-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Shield, RefreshCw, LogOut } from 'lucide-react'
import type { FeedDay } from '@/lib/types'

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

function filterByChannel(days: FeedDay[], channel: string | null): FeedDay[] {
  if (!channel) return days
  return days
    .map((day) => ({
      ...day,
      matches: day.matches.filter((match) => match.channelName === channel),
    }))
    .filter((day) => day.matches.length > 0)
}

export function FeedClient({ initialFeed, userName, userEmail, userImage }: { initialFeed: FeedDay[]; userName?: string; userEmail?: string; userImage?: string }) {
  const [rawFeed, setRawFeed] = useState<FeedDay[]>(initialFeed)
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set())

  // Hydrate watched state after mount to avoid SSR mismatch
  useEffect(() => {
    setWatchedSet(getWatchedVods())
  }, [])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const channels = useMemo(() => extractChannels(rawFeed), [rawFeed])

  const feedWithWatched = useMemo(
    () => applyWatchedState(rawFeed, watchedSet),
    [rawFeed, watchedSet],
  )

  const filteredFeed = useMemo(
    () => filterByChannel(feedWithWatched, activeFilter),
    [feedWithWatched, activeFilter],
  )

  const handlePlay = useCallback(
    (youtubeVideoId: string) => {
      markWatched(youtubeVideoId)
      setWatchedSet(getWatchedVods())
    },
    [],
  )

  const handleRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/feed')
      if (res.ok) {
        const data = await res.json()
        setRawFeed(data)
      }
    } catch {}
    setWatchedSet(getWatchedVods())
  }, [])

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
      <header className="flex items-center justify-between px-4 py-4 border-b border-[#D4A843]/20">
        <div className="flex items-center gap-2">
          <Shield className="size-6 text-[#D4A843]" />
          <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold text-[#D4A843]">
            Spoiler Shield
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            aria-label="Refresh feed"
            className="text-zinc-400 hover:text-white"
          >
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <div className="flex items-center gap-2 rounded-full bg-[#1a1a1a] pl-1 pr-2 py-1">
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
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <main className="flex-1 px-4 py-4">
        <MatchFeed days={filteredFeed} onPlay={handlePlay} />
      </main>

    </div>
  )
}
