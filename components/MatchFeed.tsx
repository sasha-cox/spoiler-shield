import type { FeedDay } from '@/lib/types'
import { MatchCard } from '@/components/MatchCard'
import { GameList } from '@/components/GameList'

interface MatchFeedProps {
  days: FeedDay[]
  onPlay?: (youtubeVideoId: string) => void
}

export function MatchFeed({ days, onPlay }: MatchFeedProps) {
  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[#8A8A8A] text-xl">No VODs ready yet — <span className="text-[#D4A843]">check back soon</span></p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => (
        <section key={day.date} data-testid="feed-day">
          <h2
            data-testid="day-header"
            className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm py-3 text-lg font-semibold text-white border-b border-zinc-800 border-l-2 border-l-[#D4A843] pl-3 mb-4"
          >
            {day.label}
          </h2>

          <div className="flex flex-col gap-4">
            {day.matches.map((match, index) => (
              <div key={match.id} className={`flex flex-col gap-2 animate-fade-in-up delay-${Math.min(index + 1, 10)}`}>
                <MatchCard match={match} onPlay={onPlay} />
                {match.games && match.games.length > 0 && (
                  <GameList games={match.games} onPlay={onPlay} />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
