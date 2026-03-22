export function getUploadsPlaylistId(channelId: string): string {
  return 'UU' + channelId.slice(2)
}

export interface YouTubeUpload {
  videoId: string
  title: string
  publishedAt: Date
}

export async function getRecentUploads(
  channelId: string,
  apiKey: string,
  maxResults: number = 15
): Promise<YouTubeUpload[]> {
  const playlistId = getUploadsPlaylistId(channelId)
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  url.searchParams.set('part', 'snippet,contentDetails')
  url.searchParams.set('playlistId', playlistId)
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      console.error('YouTube API error:', res.status)
      return []
    }
    const data = await res.json()

    return (data.items ?? []).map((item: any) => ({
      videoId: item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId,
      title: item.snippet?.title ?? '',
      publishedAt: new Date(item.snippet?.publishedAt ?? item.contentDetails?.videoPublishedAt),
    }))
  } catch (err) {
    console.error('YouTube API fetch failed:', err)
    return []
  }
}
