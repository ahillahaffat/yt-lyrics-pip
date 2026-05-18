import { LRCLibRepository } from "@/repositories/LRCLibRepository"
import { LyricsResult, VideoData } from "@/types"

export const LyricsService = {
  async getForVideo(video: VideoData): Promise<LyricsResult> {
    const parsed = titleParser.parse(video.title, video.author)

    if (!parsed.trackName?.trim()) {
      return { status: 'not_found', lines: [], trackName: video.title, artistName: video.author }
    }

    const result = await LRCLibRepository.fetchLyrics(
      parsed.trackName,
      parsed.artistName
    )

    if (result.status === 'not_found' && parsed.artistName?.trim()) {
      console.log('[LyricsService] Retrying without artist...')
      return LRCLibRepository.fetchLyrics(parsed.trackName, null)
    }

    return result
  }
}