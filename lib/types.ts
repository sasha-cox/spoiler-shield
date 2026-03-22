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
  youtubeVideoId?: string  // Single VOD for the whole series (e.g., Caedrel costreams)
  channelName?: string     // Channel that uploaded the VOD
  watched?: boolean        // Whether this single VOD has been watched
  games?: FeedGameEntry[]  // Per-game VODs (for channels that upload separately)
}

export interface FeedDay {
  date: string       // YYYY-MM-DD
  label: string      // "Today", "Yesterday", "March 20"
  matches: FeedMatch[]
}
