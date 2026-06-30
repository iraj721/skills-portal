// lib/youtube.ts
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export interface YouTubeVideoInfo {
  title: string
  thumbnailUrl: string
  duration: string
  channelTitle: string
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo | null> {
  if (!YOUTUBE_API_KEY) {
    // Fallback: return basic info without API
    return {
      title: "YouTube Video",
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: "Unknown",
      channelTitle: "Unknown",
    }
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    if (!data.items || data.items.length === 0) return null

    const item = data.items[0]
    return {
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url,
      duration: item.contentDetails.duration, // ISO 8601 format
      channelTitle: item.snippet.channelTitle,
    }
  } catch (error) {
    console.error("YouTube API error:", error)
    return null
  }
}