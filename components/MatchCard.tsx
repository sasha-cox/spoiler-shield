'use client'

import { useState } from 'react'
import type { FeedMatch } from '@/lib/types'

/**
 * Deterministically pick a color for a team name by hashing the string.
 * Returns a Tailwind bg-color class from a curated set of vibrant colors.
 */
const TEAM_COLORS = [
  'bg-red-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-yellow-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-cyan-600',
] as const

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function teamColor(name: string): string {
  return TEAM_COLORS[hashString(name) % TEAM_COLORS.length]
}

function formatLabel(format: FeedMatch['format']): string {
  switch (format) {
    case 'bo1':
      return 'Bo1'
    case 'bo3':
      return 'Bo3'
    case 'bo5':
      return 'Bo5'
  }
}

interface MatchCardProps {
  match: FeedMatch
  onPlay?: (youtubeVideoId: string) => void
}

export function MatchCard({ match, onPlay }: MatchCardProps) {
  const [showPlayer, setShowPlayer] = useState(false)
  const teamAInitial = match.teamA.charAt(0).toUpperCase()
  const teamBInitial = match.teamB.charAt(0).toUpperCase()

  const handleWatch = () => {
    if (match.youtubeVideoId) {
      onPlay?.(match.youtubeVideoId)
    }
  }

  return (
    <div
      data-testid="match-card"
      className={`w-full rounded-xl border border-[#1a1a1a] border-l-2 border-l-[#D4A843] bg-[#141414] p-4 relative${match.watched ? ' opacity-40' : ''}`}
    >
      {/* Format badge */}
      <span className="absolute top-3 right-3 rounded-full bg-[#D4A843]/20 px-2.5 py-0.5 text-xs font-medium text-[#D4A843]">
        {formatLabel(match.format)}
      </span>

      {/* Teams row */}
      <div className="flex items-center justify-center gap-4 py-2">
        {/* Team A */}
        <div className="flex items-center gap-2">
          <div
            data-testid="team-initial"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-current/20 ${teamColor(match.teamA)}`}
          >
            {teamAInitial}
          </div>
          <span className="text-lg font-semibold text-white">{match.teamA}</span>
        </div>

        {/* Divider */}
        <span className="text-sm font-medium text-zinc-500">vs</span>

        {/* Team B */}
        <div className="flex items-center gap-2">
          <div
            data-testid="team-initial"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-current/20 ${teamColor(match.teamB)}`}
          >
            {teamBInitial}
          </div>
          <span className="text-lg font-semibold text-white">{match.teamB}</span>
        </div>
      </div>

      {/* Event name */}
      <p className="mt-1 text-center text-sm text-zinc-400">{match.eventName}</p>

      {/* Watch link -- plain <a> tag, works everywhere, no JS needed */}
      {match.youtubeVideoId && (
        <a
          href={`/watch/${match.youtubeVideoId}`}
          className="mt-3 block w-full rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 py-2.5 text-sm font-semibold text-white text-center transition-colors hover:from-amber-500 hover:to-yellow-500"
        >
          Watch
        </a>
      )}
    </div>
  )
}
