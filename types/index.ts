export interface VideoData {
  videoId: string
  title: string
  author: string
}

export interface ParsedTrack {
  trackName: string
  artistName: string | null
}

export interface LyricLine {
  time: number | null
  text: string
}

export type LyricsStatus = 'synced' | 'plain' | 'not_found' | 'not_music'

export interface LyricsResult {
  status: LyricsStatus
  lines: LyricLine[]
  trackName: string
  artistName: string
}

export type MessageType =
  | { type: 'VIDEO_CHANGED'; payload: VideoData }
  | { type: 'LYRICS_READY'; payload: LyricsResult }
  | { type: 'TIME_UPDATE'; payload: { currentTime: number } }
  | { type: 'SEEK_TO'; payload: { time: number } }
  | { type: 'PIP_ACTIVATED' }
  | { type: 'EXTENSION_TOGGLED'; payload: { active: boolean } }
