import { LRCLibRepository } from "@/repositories/LRCLibRepository"
import { LyricsResult, VideoData } from "@/types"


export const LyricsService = {
  async getForVideo(video: VideoData): Promise<LyricsResult> {

    const contentType = detectContentType(video.title, video.author)
    if (contentType === 'non_music') {
      return { status: 'not_music', lines: [], trackName: video.title, artistName: video.author }
    }
    const parsed = titleParser.parse(video.title, video.author)

    if (!parsed.trackName?.trim()) {
      return { status: 'not_found', lines: [], trackName: video.title, artistName: video.author }
    }

    const result = await LRCLibRepository.fetchLyrics(
      parsed.trackName,
      parsed.artistName,
      video.videoId
    )

    if (result.status === 'not_found' && parsed.artistName?.trim()) {
      console.log('[LyricsService] Retrying without artist...')
      return LRCLibRepository.fetchLyrics(parsed.trackName, null)
    }

    if (result.status === 'not_found' && contentType === 'unknown') {
      return { status: 'not_music', lines: [], trackName: video.title, artistName: video.author }
    }

    return result
  }
}