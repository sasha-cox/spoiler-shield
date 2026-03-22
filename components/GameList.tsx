import type { FeedGameEntry } from '@/lib/types'

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
    <div className="flex flex-col gap-2">
      {games.map((game) => (
        <div
          key={game.gameNumber}
          data-testid="game-entry"
          className={`flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3${game.watched ? ' opacity-50' : ''}`}
        >
          <span className="text-sm font-medium text-zinc-200">
            Game {game.gameNumber}
          </span>
          <button
            type="button"
            aria-label="Watch"
            onClick={() => handlePlay(game)}
            className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-600"
          >
            Watch
          </button>
        </div>
      ))}
    </div>
  )
}
