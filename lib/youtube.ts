export function getUploadsPlaylistId(channelId: string): string {
  return 'UU' + channelId.slice(2)
}

export interface YouTubeUpload {
  videoId: string
  title: string
  publishedAt: Date
}

interface YouTubePlaylistItem {
  contentDetails?: { videoId?: string; videoPublishedAt?: string }
  snippet?: {
    title?: string
    publishedAt?: string
    resourceId?: { videoId?: string }
  }
}

interface YouTubePlaylistResponse {
  items?: YouTubePlaylistItem[]
  nextPageToken?: string
}

const PAGE_SIZE = 50
const MAX_PAGES = 4

/**
 * Fetches recent uploads from a channel's uploads playlist, paging until we
 * either pass `sinceDays` of history or hit `MAX_PAGES`. Busy channels
 * (LEC, LCK, etc.) post enough non-match content per day that a single
 * 50-item page can miss real match VODs from a few days ago.
 */
export async function getRecentUploads(
  channelId: string,
  apiKey: string,
  sinceDays: number = 21
): Promise<YouTubeUpload[]> {
  const playlistId = getUploadsPlaylistId(channelId)
  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000
  const collected: YouTubeUpload[] = []
  let pageToken: string | undefined

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('playlistId', playlistId)
    url.searchParams.set('maxResults', String(PAGE_SIZE))
    url.searchParams.set('key', apiKey)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    try {
      const res = await fetch(url.toString())
      if (!res.ok) {
        console.error(`YouTube API error for channel ${channelId}:`, res.status)
        break
      }
      const data: YouTubePlaylistResponse = await res.json()
      const items = (data.items ?? []).map((item) => ({
        videoId: item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? '',
        title: item.snippet?.title ?? '',
        publishedAt: new Date(item.snippet?.publishedAt ?? item.contentDetails?.videoPublishedAt ?? 0),
      }))
      collected.push(...items)

      const oldestThisPage = items[items.length - 1]
      if (!data.nextPageToken || !oldestThisPage || oldestThisPage.publishedAt.getTime() < cutoff) {
        break
      }
      pageToken = data.nextPageToken
    } catch (err) {
      console.error(`YouTube API fetch failed for channel ${channelId}:`, err)
      break
    }
  }

  return collected.filter((u) => u.publishedAt.getTime() >= cutoff)
}
