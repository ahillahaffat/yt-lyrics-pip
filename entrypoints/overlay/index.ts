import { MessageBus } from '@/infrastructure/MessageBus'
import type { MessageType, LyricsResult, LyricLine, VideoData } from '@/types'

let currentLyrics: LyricsResult | null = null
let currentLineIndex: number = -1
let currentVideoData: VideoData | null = null

const thumbnail = document.getElementById('thumbnail') as HTMLImageElement | null
const trackName = document.getElementById('track-name') as HTMLElement | null
const artistName = document.getElementById('artist-name') as HTMLElement | null
const lyricsList = document.getElementById('lyrics-list') as HTMLElement | null
const syncBadge = document.getElementById('sync-badge') as HTMLElement | null
const bgBlur = document.getElementById('bg-blur') as HTMLElement | null
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement | null

function extractDominantColor(img: HTMLImageElement): { r: number; g: number; b: number } {
  try {
    const canvas = document.createElement('canvas')
    const size = 50
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return { r: 30, g: 0, b: 0 }

    ctx.drawImage(img, 0, 0, size, size)
    const data = ctx.getImageData(0, 0, size, size).data

    let r = 0, g = 0, b = 0, count = 0
    for (let i = 0; i < data.length; i += 16) {
      const pr = data[i], pg = data[i + 1], pb = data[i + 2]
      const brightness = (pr + pg + pb) / 3
      if (brightness < 30 || brightness > 220) continue
      r += pr; g += pg; b += pb; count++
    }

    if (count === 0) return { r: 80, g: 0, b: 0 }
    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count)
    }
  } catch {
    return { r: 80, g: 0, b: 0 }
  }
}

function applyDynamicColor(img: HTMLImageElement): void {
  const { r, g, b } = extractDominantColor(img)
  const dr = Math.round(r * 0.6)
  const dg = Math.round(g * 0.6)
  const db = Math.round(b * 0.6)

  document.documentElement.style.setProperty('--dynamic-color', `rgb(${dr},${dg},${db})`)
  document.documentElement.style.setProperty('--dynamic-color-subtle', `rgba(${dr},${dg},${db},0.15)`)

  if (bgBlur) {
    bgBlur.style.background = `
      radial-gradient(ellipse at top left, rgba(${dr},${dg},${db},0.5) 0%, transparent 60%),
      radial-gradient(ellipse at bottom right, rgba(${Math.round(dr*0.7)},${Math.round(dg*0.7)},${Math.round(db*0.7)},0.3) 0%, transparent 60%)
    `
  }
}

function updateThumbnail(videoId: string): void {
  if (!thumbnail) return
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  img.onload = () => {
    thumbnail.src = img.src
    applyDynamicColor(img)
  }
  img.onerror = () => {
    thumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }
}

function renderLyrics(lyrics: LyricsResult): void {
  if (!trackName || !artistName || !lyricsList || !syncBadge) return

  trackName.textContent = lyrics.trackName
  artistName.textContent = lyrics.artistName

  if (lyrics.status === 'synced') {
    syncBadge.textContent = 'Synced'
    syncBadge.className = 'badge synced'
  } else if (lyrics.status === 'plain') {
    syncBadge.textContent = 'Unsynced'
    syncBadge.className = 'badge unsynced'
  } else {
    syncBadge.textContent = 'Not found'
    syncBadge.className = 'badge not-found'
  }

  lyricsList.innerHTML = ''

  if (lyrics.status === 'not_found') {
    const msg = document.createElement('div')
    msg.className = 'lyrics-empty'
    msg.textContent = 'No lyrics found for this track.'
    lyricsList.appendChild(msg)
    return
  }

  lyrics.lines.forEach((line: LyricLine, index: number) => {
    const el = document.createElement('div')
    el.className = 'lyric-line'
    el.textContent = line.text
    el.dataset.index = String(index)

    if (line.time !== null) {
      el.addEventListener('click', () => {
        MessageBus.send({ type: 'SEEK_TO', payload: { time: line.time as number } })
      })
      el.classList.add('clickable')
    }

    lyricsList.appendChild(el)
  })
}

function updateHighlight(currentTime: number): void {
  if (!currentLyrics || currentLyrics.status !== 'synced' || !lyricsList) return

  const lines = currentLyrics.lines
  let activeIndex = -1

  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time !== null && currentTime >= (lines[i].time as number)) {
      activeIndex = i
      break
    }
  }

  if (activeIndex === currentLineIndex) return
  currentLineIndex = activeIndex

  document.querySelectorAll('.lyric-line').forEach(el => el.classList.remove('active'))

  if (activeIndex === -1) return

  const activeEl = lyricsList.querySelector(
    `[data-index="${activeIndex}"]`
  ) as HTMLElement | null

  if (activeEl) {
    activeEl.classList.add('active')
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Refresh button
refreshBtn?.addEventListener('click', async () => {
  if (!currentVideoData) return

  refreshBtn.classList.add('spinning')
  refreshBtn.disabled = true

  // Kirim ulang VIDEO_CHANGED ke background supaya re-fetch lyrics
  MessageBus.send({ type: 'VIDEO_CHANGED', payload: currentVideoData })

  setTimeout(() => {
    refreshBtn.classList.remove('spinning')
    refreshBtn.disabled = false
  }, 1500)
})

MessageBus.listen((message: MessageType) => {
  switch (message.type) {
    case 'LYRICS_READY': {
      currentLyrics = message.payload
      currentLineIndex = -1
      renderLyrics(message.payload)
      break
    }
    case 'VIDEO_CHANGED': {
      currentVideoData = message.payload
      updateThumbnail(message.payload.videoId)
      break
    }
    case 'TIME_UPDATE': {
      updateHighlight(message.payload.currentTime)
      break
    }
  }
})

chrome.runtime.sendMessage({ type: 'OVERLAY_READY' }).catch(() => {})