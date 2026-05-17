import { LyricLine } from "@/types"

export const LRCParser = {
  parse(lrc: string): LyricLine[] {
    const lines: LyricLine[] = []
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/

    for (const raw of lrc.split('\n')) {
      const match = raw.match(regex)
      if (!match) continue

      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + ms / 1000
      const text = match[4].trim()

      if (text) lines.push({ time, text })
    }

    return lines
  }
}