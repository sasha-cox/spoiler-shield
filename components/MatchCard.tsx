'use client'

import { useState } from 'react'
import type { FeedMatch } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Star, Clock, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'

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

/** Convert ALL CAPS event names to Title Case, preserving short numbers/years */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (/^\d+$/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/** Extract a short abbreviation from a team name (e.g. "G2 Esports" → "G2") */
function teamAbbr(name: string): string {
  if (name.length <= 3) return name.toUpperCase()
  const firstWord = name.split(/\s+/)[0]
  if (firstWord.length <= 4) return firstWord.toUpperCase()
  return name.slice(0, 3).toUpperCase()
}

/** Format a relative time string from an ISO date */
function timeAgo(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

interface MatchCardProps {
  match: FeedMatch
  onPlay?: (youtubeVideoId: string) => void
  isFollowed?: boolean
}

export function MatchCard({ match, onPlay, isFollowed }: MatchCardProps) {
  const [showTime, setShowTime] = useState(false)

  const eventDisplay = match.eventName === match.eventName.toUpperCase()
    ? toTitleCase(match.eventName)
    : match.eventName

  return (
    <Card
      data-testid="match-card"
      className={cn(
        'relative border-l-2 bg-surface ring-surface-border',
        isFollowed ? 'border-l-gold ring-gold/15' : 'border-l-gold',
        match.watched && 'opacity-40'
      )}
    >
      <CardContent className="relative pt-1 pb-1">
        {/* Badges row */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5">
          {isFollowed && (
            <Star className="size-3.5 text-gold fill-gold" />
          )}
          {match.watched && (
            <Badge
              variant="secondary"
              className="bg-zinc-700/60 text-zinc-400 text-[10px] uppercase tracking-wider"
            >
              Watched
            </Badge>
          )}
          {match.region && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${match.regionColor}20`, color: match.regionColor }}
            >
              {match.regionFlag} {match.region}
            </span>
          )}
          <Badge
            className="bg-gold/15 text-gold border-gold/20"
          >
            {formatLabel(match.format)}
          </Badge>
        </div>

        {/* Teams row */}
        <div className="flex items-center justify-center gap-5 py-3 mt-2">
          {/* Team A */}
          <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
            <span className="text-xl font-bold text-white tracking-wide">
              {teamAbbr(match.teamA)}
            </span>
            <span className="text-xs text-zinc-500 truncate max-w-[100px]">
              {match.teamA}
            </span>
          </div>

          {/* Divider */}
          <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">vs</span>

          {/* Team B */}
          <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
            <span className="text-xl font-bold text-white tracking-wide">
              {teamAbbr(match.teamB)}
            </span>
            <span className="text-xs text-zinc-500 truncate max-w-[100px]">
              {match.teamB}
            </span>
          </div>
        </div>

        {/* Event name */}
        <p className="text-center text-xs text-zinc-500 mb-2">
          {eventDisplay}
        </p>

        {/* Channel + time row */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {match.channelName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
              <Youtube className="size-3 text-red-500" />
              {match.channelName}
            </span>
          )}
          {match.publishedAt && (
            <button
              onClick={() => setShowTime(!showTime)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                showTime
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-zinc-800/50 text-zinc-600 hover:text-zinc-400'
              )}
              aria-label={showTime ? 'Hide upload time' : 'Show upload time (possible spoiler)'}
            >
              <Clock className="size-3" />
              {showTime ? timeAgo(match.publishedAt) : 'Posted ???'}
            </button>
          )}
        </div>

        {/* Watch link */}
        {match.youtubeVideoId && (
          <a
            href={`/watch/${match.youtubeVideoId}`}
            className="block w-full"
          >
            <Button
              className="w-full bg-gradient-to-r from-gold to-[#b8912e] text-black font-semibold hover:from-[#e0b84d] hover:to-[#c9a035] cursor-pointer"
              size="lg"
              render={<span />}
            >
              <Play className="size-4 fill-current" />
              Watch
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  )
}
