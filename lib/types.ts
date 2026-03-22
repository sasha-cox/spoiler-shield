export interface FeedGameEntry {
  gameNumber: number       // 1-indexed
  youtubeVideoId?: string  // undefined for padded/unplayed games
  channelName?: string
  watched: boolean
}

export interface FeedMatch {
  id: string
  teamA: string
  teamB: string
  eventName: string
  format: 'bo1' | 'bo3' | 'bo5'
  games: FeedGameEntry[]   // ALWAYS has maxGames entries (1/3/5) -- padded server-side
}

export interface FeedDay {
  date: string       // YYYY-MM-DD
  label: string      // "Today", "Yesterday", "March 20"
  matches: FeedMatch[]
}
