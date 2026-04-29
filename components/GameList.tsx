import type { FeedGameEntry } from '@/lib/types'
import { Play } from 'lucide-react'

interface GameListProps {
  games: FeedGameEntry[]
  onPlay?: (youtubeVideoId: string) => void
}

export function GameList({ games, onPlay }: GameListProps) {
  function handlePlay(entry: FeedGameEntry) {
    if (!entry.youtubeVideoId) return

    if (onPlay) {
      onPlay(entry.youtubeVideoId)
    } else {
      window.open(
        `https://www.youtube.com/watch?v=${entry.youtubeVideoId}`,
        '_blank',
      )
    }
  }

  return (
    <div className="flex flex-col gap-1.5 pl-3">
      {games.map((game) => (
        <div
          key={game.gameNumber}
          data-testid="game-entry"
          className={`group flex items-center justify-between rounded-md border border-white/[0.04] bg-zinc-950/60 px-3 py-2 transition-colors hover:border-gold/20 hover:bg-zinc-950${game.watched ? ' opacity-50' : ''}`}
        >
          <span className="font-display text-sm font-semibold tracking-wide text-zinc-200">
            Game {game.gameNumber}
          </span>
          <button
            type="button"
            aria-label="Watch"
            onClick={() => handlePlay(game)}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
          >
            <Play className="size-2.5 fill-current" />
            Watch
          </button>
        </div>
      ))}
    </div>
  )
}
