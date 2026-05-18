const MUSIC_SIGNALS = [
  /official\s*(music\s*)?video/i,
  /\blyrics?\b/i,
  /\bft\.?\s/i,
  /\bfeat\.?\s/i,
  /\bmv\b/i,
  /\baudio\b/i,
  /\balbum\b/i,
  /\bsingle\b/i,
  /\bcover\b/i,
  /\bacoustic\b/i,
  /\blive\s+(at|at the|session)/i,
]

const NON_MUSIC_SIGNALS = [
  /\bpodcast\b/i,
  /\beps?\.\s*\d+/i,
  /\bepisode\s*\d+/i,
  /\bhighlights?\b/i,
  /\bgoal(s)?\b/i,
  /\bmatch\b/i,
  /\bvs\.?\b/i,
  /\bresmi\b/i,
  /\bbreaking\b/i,
]

export type ContentType = 'music' | 'non_music' | 'unknown'

export function detectContentType(title: string, author: string): ContentType {
  const text = `${title} ${author}`
  
  const musicScore = MUSIC_SIGNALS.filter(p => p.test(text)).length
  const nonMusicScore = NON_MUSIC_SIGNALS.filter(p => p.test(text)).length
  
  if (musicScore > 0 && nonMusicScore === 0) return 'music'
  if (nonMusicScore > 0 && musicScore === 0) return 'non_music'
  
  return 'unknown'
}