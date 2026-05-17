import type { ParsedTrack } from '@/types'

const NOISE_PATTERNS = [
  /\s*\(official\s+(music\s+)?video\)\s*$/i,
  /\s*\[official\s+(music\s+)?video\]\s*$/i,
  /\s*\(official\s+audio\)\s*$/i,
  /\s*\[official\s+audio\]\s*$/i,
  /\s*\(lyrics?\s+video\)\s*$/i,
  /\s*\[lyrics?\s+video\]\s*$/i,
  /\s*\(lyrics?\)\s*$/i,
  /\s*\[lyrics?\]\s*$/i,
  /\s*\(mv\)\s*$/i,
  /\s*\[mv\]\s*$/i,
  /\s*\(m\/v\)\s*$/i,
  /\s*\[m\/v\]\s*$/i,
  /\s*\(audio\)\s*$/i,
  /\s*\[audio\]\s*$/i,
  /\s*\(hd|4k|fullhd\)\s*$/i,
  /\s*\[hd|4k|fullhd\]\s*$/i,
  /\s*[-–—]\s*\(official|audio|video|lyric\)\s*$/i,
]

function stripNoise(str: string): string {
  let result = str
  for (const pattern of NOISE_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result.trim()
}

function normalizeArtist(name: string): string {
  return name
    .replace(/\s+(Official|VEVO|Lyrics|Music|Channel|Topic)\s*$/i, '')
    .replace(/^the\s+/i, '')
    .toLowerCase()
    .trim()
}

function splitTrackAndArtist(title: string): [string, string] | null {
  const dashPatterns = [
    /\s+[-–—]\s+/,
    /\s*\|\s*/,
  ]

  for (const pattern of dashPatterns) {
    const parts = title.split(pattern)
    if (parts.length === 2) {
      const first = parts[0].trim()
      const second = parts[1].trim()
      if (first.length > 0 && second.length > 0) {
        return [first, second]
      }
    }
  }
  return null
}

export const titleParser = {
  parse(title: string, author: string): ParsedTrack {
    if (!title?.trim()) {
      return { trackName: '', artistName: author || null }
    }

    const cleaned = stripNoise(title)
    const split = splitTrackAndArtist(cleaned)

    if (split) {
      const [first, second] = split
      const authorNorm = normalizeArtist(author)
      const firstNorm = normalizeArtist(first)

      const isFirstArtist = 
        authorNorm.includes(firstNorm) ||
        firstNorm.includes(authorNorm) ||
        authorNorm.split(' ').some(word => word.length > 2 && firstNorm.includes(word))

      if (isFirstArtist) {
        return { trackName: second, artistName: first }
      } else {
        return { trackName: first, artistName: second }
      }
    }

    return {
      trackName: cleaned,
      artistName: author ? normalizeArtist(author) : null
    }
  }
}