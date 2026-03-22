'use client'

import { useState, useCallback, useMemo } from 'react'
import { getMockFeed } from '@/lib/mock-feed'
import { FilterBar } from '@/components/FilterBar'
import { MatchFeed } from '@/components/MatchFeed'
import { markWatched, getWatchedVods } from '@/lib/watched-store'
import type { FeedDay } from '@/lib/types'

/**
 * Merge persisted watched state into feed data so the UI reflects
 * what the user has already seen.
 */
function applyWatchedState(days: FeedDay[], watched: Set<string>): FeedDay[] {
  return days.map((day) => ({
    ...day,
    matches: day.matches.map((match) => ({
      ...match,
      games: match.games.map((game) => ({
        ...game,
        watched: game.youtubeVideoId
          ? watched.has(game.youtubeVideoId)
          : game.watched,
      })),
    })),
  }))
}

/**
 * Extract unique channel names from the feed data.
 */
function extractChannels(days: FeedDay[]): string[] {
  const set = new Set<string>()
  for (const day of days) {
    for (const match of day.matches) {
      for (const game of match.games) {
        if (game.channelName) set.add(game.channelName)
      }
    }
  }
  return [...set].sort()
}

/**
 * Filter feed data to only include matches that have at least one game
 * from the selected channel.
 */
function filterByChannel(days: FeedDay[], channel: string | null): FeedDay[] {
  if (!channel) return days
  return days
    .map((day) => ({
      ...day,
      matches: day.matches.filter((match) =>
        match.games.some((game) => game.channelName === channel),
      ),
    }))
    .filter((day) => day.matches.length > 0)
}

export default function Home() {
  const [rawFeed, setRawFeed] = useState<FeedDay[]>(() => getMockFeed())
  const [watchedSet, setWatchedSet] = useState<Set<string>>(() => getWatchedVods())
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
      window.open(
        `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        '_blank',
      )
      markWatched(youtubeVideoId)
      setWatchedSet(getWatchedVods())
    },
    [],
  )

  const handleRefresh = useCallback(() => {
    setRawFeed(getMockFeed())
    setWatchedSet(getWatchedVods())
  }, [])

  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
      <header className="flex items-center justify-between px-4 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Spoiler Shield</h1>
        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh feed"
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Refresh
        </button>
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
