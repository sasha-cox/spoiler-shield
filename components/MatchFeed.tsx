import type { FeedDay } from '@/lib/types'
import { MatchCard } from '@/components/MatchCard'
import { GameList } from '@/components/GameList'

interface MatchFeedProps {
  days: FeedDay[]
}

export function MatchFeed({ days }: MatchFeedProps) {
  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400 text-lg">No VODs ready yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => (
        <section key={day.date} data-testid="feed-day">
          <h2
            data-testid="day-header"
            className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm py-3 text-lg font-semibold text-white border-b border-zinc-800 mb-4"
          >
            {day.label}
          </h2>

          <div className="flex flex-col gap-4">
            {day.matches.map((match) => (
              <div key={match.id} className="flex flex-col gap-2">
                <MatchCard match={match} />
                <GameList games={match.games} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
