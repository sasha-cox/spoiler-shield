'use client'

import type { FeedMatch } from '@/lib/types'
import { Star, Play, Youtube } from 'lucide-react'
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

function teamAbbr(name: string, code?: string): string {
  if (code) return code.toUpperCase()
  if (name.length <= 3) return name.toUpperCase()
  const firstWord = name.split(/\s+/)[0]
  if (firstWord.length <= 4) return firstWord.toUpperCase()
  return name.slice(0, 3).toUpperCase()
}

interface MatchCardProps {
  match: FeedMatch
  onPlay?: (youtubeVideoId: string) => void
  isFollowed?: boolean
}

export function MatchCard({ match, isFollowed }: MatchCardProps) {
  const eventDisplay =
    match.eventName === match.eventName.toUpperCase()
      ? toTitleCase(match.eventName)
      : match.eventName

  const accentColor = match.regionColor ?? '#D4A843'
  const href = match.youtubeVideoId ? `/watch/${match.youtubeVideoId}` : undefined

  const Wrapper: React.ElementType = href ? 'a' : 'div'
  const wrapperProps = href ? { href } : {}

  return (
    <Wrapper
      {...wrapperProps}
      data-testid="match-card"
      className={cn(
        'group relative block overflow-hidden rounded-xl bg-surface',
        'ring-1 ring-surface-border transition-all duration-300',
        href && 'hover:ring-gold/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_rgba(212,168,67,0.25)] cursor-pointer',
        match.watched && 'opacity-45',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-[3px]',
          isFollowed && 'shadow-[0_0_16px_rgba(212,168,67,0.45)]',
        )}
        style={{
          background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}40)`,
        }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      />

      <div className="relative flex flex-col gap-3 px-4 py-3.5 pl-5">
        <div className="flex items-center justify-between gap-2 text-[11px] tracking-[0.18em] uppercase">
          <div className="flex items-center gap-2 min-w-0">
            {match.region && (
              <span
                className="inline-flex items-center gap-1.5 font-semibold"
                style={{ color: accentColor }}
              >
                <span aria-hidden>{match.regionFlag}</span>
                {match.region}
              </span>
            )}
            {match.region && (
              <span className="size-1 rounded-full bg-zinc-700 shrink-0" aria-hidden />
            )}
            <span className="font-display text-zinc-400 truncate">
              {eventDisplay}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isFollowed && (
              <Star className="size-3.5 text-gold fill-gold drop-shadow-[0_0_4px_rgba(212,168,67,0.6)]" />
            )}
            {match.watched && (
              <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-zinc-500">
                WATCHED
              </span>
            )}
            {match.kind === 'unofficial' && (
              <span
                title="Not in Riot's official schedule — derived from the upload title. Lower confidence."
                className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-400"
              >
                UNOFFICIAL
              </span>
            )}
            <span
              className="rounded-sm border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gold"
            >
              {formatLabel(match.format)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-end text-right min-w-0">
            <span className="font-display text-3xl font-bold leading-none text-white tracking-tight">
              {teamAbbr(match.teamA, match.teamACode)}
            </span>
            <span className="mt-1 text-xs text-text-secondary truncate max-w-full">
              {match.teamA}
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span
                className="h-6 w-px"
                style={{ background: `linear-gradient(to bottom, transparent, ${accentColor}55, transparent)` }}
              />
            </span>
            <span className="relative font-display text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600 px-2 bg-surface">
              vs
            </span>
          </div>

          <div className="flex flex-col items-start text-left min-w-0">
            <span className="font-display text-3xl font-bold leading-none text-white tracking-tight">
              {teamAbbr(match.teamB, match.teamBCode)}
            </span>
            <span className="mt-1 text-xs text-text-secondary truncate max-w-full">
              {match.teamB}
            </span>
          </div>
        </div>

        {match.youtubeVideoId && (
          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary min-w-0">
              {match.channelName && (
                <>
                  <Youtube className="size-3 text-red-500/80 shrink-0" />
                  <span className="truncate">{match.channelName}</span>
                </>
              )}
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold',
                'transition-transform duration-300 group-hover:translate-x-0.5',
              )}
            >
              Watch
              <Play className="size-3 fill-gold" />
            </span>
          </div>
        )}
      </div>
    </Wrapper>
  )
}
