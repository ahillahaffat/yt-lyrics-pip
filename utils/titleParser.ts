import type { ParsedTrack } from '@/types'

const NOISE_PATTERNS = [
  /\(official\s*(music\s*)?video\)/i,
  /\[official\s*(music\s*)?video\]/i,
  /\(official\s*audio\)/i,
  /\[official\s*audio\]/i,
  /\(lyrics?\s*video\)/i,
  /\[lyrics?\s*video\]/i,
  /\(lyrics?\)/i,
  /\[lyrics?\]/i,
  /\(mv\)/i,
  /\[mv\]/i,
  /\(m\/v\)/i,
  /\[m\/v\]/i,
  /\(audio\)/i,
  /\[audio\]/i,
  /\(hd\)/i,
  /\[hd\]/i,
  /\d{4}\s*remaster(ed)?/i,
  /\(remaster(ed)?\s*\d{4}\)/i,
  /\[remaster(ed)?\s*\d{4}\]/i,
  /\(live.*?\)/i,
  /\[live.*?\]/i,
  /\(version.*?\)/i,
  /\[version.*?\]/i,
]

function stripNoise(str: string): string {
  let result = str
  for (const pattern of NOISE_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result.trim()
}

function normalizeArtist(name: string): string {
  return name.replace(/^the\s+/i, '').toLowerCase().trim()
}

export const titleParser = {
  parse(title: string, author: string): ParsedTrack {
    const cleaned = stripNoise(title)

    const dashSplit = cleaned.split(/\s+[-–—]\s+/)

    if (dashSplit.length >= 2) {
      const first = stripNoise(dashSplit[0].trim())
      const second = stripNoise(dashSplit[1].trim())

      const authorLower = normalizeArtist(author)
      const firstLower = normalizeArtist(first)
      const firstIsArtist = firstLower.includes(authorLower) ||
        authorLower.includes(firstLower) ||
        authorLower.split(' ').some(word => word.length > 2 && firstLower.includes(word))

      if (firstIsArtist) {
        return { trackName: second, artistName: first }
      } else {
        return { trackName: first, artistName: second }
      }
    }

    const cleanAuthor = author.replace(/VEVO|Official/gi, '').trim()
    return {
      trackName: cleaned,
      artistName: cleanAuthor || null
    }
  }
}