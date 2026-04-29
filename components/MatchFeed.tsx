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
      <div className="flex items-center justify-center py-20">
        <p className="text-text-secondary text-xl">
          {emptyMessage ?? <>No VODs ready yet — <span className="text-gold">check back soon</span></>}
        </p>
      </div>
    )
  }

  const variants = prefersReducedMotion ? noMotionVariants : cardVariants

  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => (
        <section key={day.date} data-testid="feed-day">
          <h2
            data-testid="day-header"
            className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm py-3 font-display text-sm font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/50 mb-4"
          >
            {day.label}
          </h2>

          <div className="flex flex-col gap-4">
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
