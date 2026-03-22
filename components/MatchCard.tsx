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
}

export function MatchCard({ match }: MatchCardProps) {
  const teamAInitial = match.teamA.charAt(0).toUpperCase()
  const teamBInitial = match.teamB.charAt(0).toUpperCase()

  return (
    <div
      data-testid="match-card"
      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 relative"
    >
      {/* Format badge */}
      <span className="absolute top-3 right-3 rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
        {formatLabel(match.format)}
      </span>

      {/* Teams row */}
      <div className="flex items-center justify-center gap-4 py-2">
        {/* Team A */}
        <div className="flex items-center gap-2">
          <div
            data-testid="team-initial"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${teamColor(match.teamA)}`}
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
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${teamColor(match.teamB)}`}
          >
            {teamBInitial}
          </div>
          <span className="text-lg font-semibold text-white">{match.teamB}</span>
        </div>
      </div>

      {/* Event name */}
      <p className="mt-1 text-center text-sm text-zinc-400">{match.eventName}</p>
    </div>
  )
}
