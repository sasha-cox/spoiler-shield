'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { FilterBar } from '@/components/FilterBar'
import { MatchFeed } from '@/components/MatchFeed'
import { markWatched, getWatchedVods } from '@/lib/watched-store'
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
        <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-bold text-white">Spoiler Shield</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh feed"
            className="rounded-md bg-[#1a1a1a] px-3 py-1.5 text-sm font-medium text-[#8A8A8A] transition-colors hover:bg-[#252525] hover:text-white"
          >
            Refresh
          </button>
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a1a] pl-1 pr-3 py-1">
            {userImage ? (
              <img src={userImage} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs text-white font-bold">
                {userName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="text-xs text-zinc-300 max-w-[150px] truncate">{userEmail ?? userName ?? 'User'}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
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
