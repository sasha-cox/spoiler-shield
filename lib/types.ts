export interface FeedGameEntry {
  gameNumber: number       // 1-indexed
  youtubeVideoId?: string  // undefined for padded/unplayed games
  channelName?: string
  watched: boolean
}

export interface FeedMatch {
  id: string
  /** 'official' = sourced from Riot's lolesports schedule; canonical data.
   *  'unofficial' = derived from a YouTube title alone (showmatches, content-
   *  creator tournaments, etc.) — lower confidence, badged in the UI. */
  kind?: 'official' | 'unofficial'
  teamA: string
  teamB: string
  /** Canonical short code (e.g. "DRX", "T1"). From the lolesports schedule
   *  when available; never derived from the team name. */
  teamACode?: string
  teamBCode?: string
  eventName: string
  format: 'bo1' | 'bo3' | 'bo5'
  youtubeVideoId?: string  // Single VOD for the whole series (e.g., Caedrel costreams)
  channelName?: string     // Channel that uploaded the VOD
  watched?: boolean        // Whether this single VOD has been watched
  region?: string          // Region ID (e.g., "KR", "EU") — used for filtering
  regionLabel?: string     // Display label (league name for official, region label for unofficial)
  regionFlag?: string      // Flag emoji
  regionColor?: string     // Color for the badge
  publishedAt?: string     // ISO date string of when the VOD was uploaded
  games?: FeedGameEntry[]  // Per-game VODs (for channels that upload separately)
}

export interface FeedDay {
  date: string       // YYYY-MM-DD
  label: string      // "Today", "Yesterday", "March 20"
  matches: FeedMatch[]
}

export type FeedFormat = 'bo1' | 'bo3' | 'bo5'

export interface FeedFilters {
  channel: string | null
  regions: Set<string>
  formats: Set<FeedFormat>
  searchQuery: string
  hideWatched: boolean
}

export type FilterAction =
  | { type: 'SET_CHANNEL'; channel: string | null }
  | { type: 'TOGGLE_REGION'; region: string }
  | { type: 'TOGGLE_FORMAT'; format: FeedFormat }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'TOGGLE_HIDE_WATCHED' }
  | { type: 'RESET' }
