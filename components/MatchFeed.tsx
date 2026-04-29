'use client'

import type { FeedDay } from '@/lib/types'
import { MatchCard } from '@/components/MatchCard'
import { GameList } from '@/components/GameList'
import { motion, useReducedMotion } from 'framer-motion'

interface MatchFeedProps {
  days: FeedDay[]
  onPlay?: (youtubeVideoId: string) => void
  followedTeams?: Set<string>
  emptyMessage?: string
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.06, 0.6),
      duration: 0.4,
      ease: EASE,
    },
  }),
}

const noMotionVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

export function MatchFeed({ days, onPlay, followedTeams, emptyMessage }: MatchFeedProps) {
  const prefersReducedMotion = useReducedMotion()

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="font-display text-xs uppercase tracking-[0.3em] text-zinc-600 mb-3">
          Standby
        </div>
        <p className="text-text-secondary text-lg max-w-xs">
          {emptyMessage ?? <>No VODs ready yet — <span className="text-gold">check back soon</span></>}
        </p>
      </div>
    )
  }

  const variants = prefersReducedMotion ? noMotionVariants : cardVariants

  return (
    <div className="flex flex-col gap-10">
      {days.map((day) => (
        <section key={day.date} data-testid="feed-day">
          <h2
            data-testid="day-header"
            className="sticky top-0 z-10 -mx-4 px-4 mb-4 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent backdrop-blur-sm pb-3 pt-3"
          >
            <span className="flex items-baseline gap-3">
              <span className="font-display text-xl font-bold uppercase tracking-[0.18em] text-white">
                {day.label}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {day.matches.length} {day.matches.length === 1 ? 'match' : 'matches'}
              </span>
            </span>
          </h2>

          <div className="flex flex-col gap-3">
            {day.matches.map((match, index) => {
              const isFollowed = followedTeams
                ? followedTeams.has(match.teamA) || followedTeams.has(match.teamB)
                : false

              return (
                <motion.div
                  key={match.id}
                  className="flex flex-col gap-2"
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                >
                  <MatchCard match={match} onPlay={onPlay} isFollowed={isFollowed} />
                  {match.games && match.games.length > 0 && (
                    <GameList games={match.games} onPlay={onPlay} />
                  )}
                </motion.div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
