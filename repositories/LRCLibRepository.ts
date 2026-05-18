import type { LyricsResult } from '@/types'
import { LRCParser } from '@/parsers/LRCParser'
import { StorageAdapter } from '@/infrastructure/StorageAdapter'

interface LRCLibResponse {
  syncedLyrics: string | null
  plainLyrics: string | null
  trackName: string
  artistName: string
}

interface CachedLyrics {
  data: LyricsResult
  timestamp: number
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000
const FETCH_TIMEOUT = 30000

export const LRCLibRepository = {
  async fetchLyrics(
    trackName: string,
    artistName: string | null
  ): Promise<LyricsResult> {
    if (!trackName?.trim()) {
      console.error('[LRCLib] Track name is empty')
      return { status: 'not_found', lines: [], trackName, artistName: artistName ?? '' }
    }

    const cacheKey = `lyrics_${trackName.toLowerCase().trim()}_${(artistName ?? 'unknown').toLowerCase().trim()}`
    const cached = await StorageAdapter.get<CachedLyrics>(cacheKey)
    if (cached?.timestamp && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[LRCLib] Cache hit:', trackName)
      return cached.data
    }

    const params = new URLSearchParams()
    params.append('track_name', trackName.trim())
    if (artistName?.trim()) {
      params.append('artist_name', artistName.trim())
    }

    const url = `https://lrclib.net/api/search?${params.toString()}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn('[LRCLib] API error:', response.status)
        return { status: 'not_found', lines: [], trackName, artistName: artistName ?? '' }
      }

      const data: LRCLibResponse[] = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        console.warn('[LRCLib] No results for:', trackName)
        return { status: 'not_found', lines: [], trackName, artistName: artistName ?? '' }
      }

      const scoreResult = (result: LRCLibResponse): number => {
        let score = 0
        
        if (result.syncedLyrics?.trim()) score += 10
        
        if (artistName && result.artistName.toLowerCase() === artistName.toLowerCase()) {
          score += 5
        }
        else if (artistName && result.artistName.toLowerCase().includes(artistName.toLowerCase())) {
          score += 2
        }
        
        return score
      }

      const best = data.reduce((prev, curr) => 
        scoreResult(curr) > scoreResult(prev) ? curr : prev
      )

      if (best.syncedLyrics?.trim()) {
        const parsed = LRCParser.parse(best.syncedLyrics)
        const result = {
          status: 'synced' as const,
          lines: parsed,
          trackName: best.trackName,
          artistName: best.artistName
        }
        await StorageAdapter.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
      }

      if (best.plainLyrics?.trim()) {
        const result = {
          status: 'plain' as const,
          lines: best.plainLyrics
            .split('\n')
            .filter((text) => text.trim())
            .map((text) => ({ time: null, text })),
          trackName: best.trackName,
          artistName: best.artistName
        }
        await StorageAdapter.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
      }

      return { status: 'not_found', lines: [], trackName, artistName: artistName ?? '' }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[LRCLib] Request timeout after 5s')
      } else {
        console.error('[LRCLib] Fetch error:', error)
      }
      return { status: 'not_found', lines: [], trackName, artistName: artistName ?? '' }
    }
  }
}