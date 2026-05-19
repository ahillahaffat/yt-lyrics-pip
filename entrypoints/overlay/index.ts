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

function resetToIdle(): void {
  if (trackName) trackName.textContent = '—'
  if (artistName) artistName.textContent = '—'
  if (lyricsList) lyricsList.innerHTML = ''
  if (syncBadge) {
    syncBadge.textContent = 'Not music'
    syncBadge.className = 'badge not-found'
  }
}

function showIdleState(): void {
  if (thumbnail) {
    thumbnail.src = '/wxt.svg'
    thumbnail.style.padding = '10px'
    thumbnail.style.background = 'rgba(255,255,255,0.05)'
  }
  if (trackName) trackName.textContent = 'YT Lyrics PiP'
  if (artistName) artistName.textContent = 'Play a song on YouTube to see lyrics'
  if (lyricsList) {
    while (lyricsList.firstChild) lyricsList.removeChild(lyricsList.firstChild)
      const idle = document.createElement('div')
      idle.className = 'idle-state'

      const logo = document.createElement('img')
      logo.src = '/logo.png'
      logo.alt = 'Logo'
      logo.className = 'idle-logo'

      const title = document.createElement('p')
      title.className = 'idle-title'
      title.textContent = 'No song playing'

      const desc = document.createElement('p')
      desc.className = 'idle-desc'
      desc.textContent = 'Start playing music on YouTube and lyrics will appear here automatically.'

      idle.append(logo, title, desc)
      lyricsList.appendChild(idle)
    }
  if (syncBadge) {
    syncBadge.textContent = 'Waiting'
    syncBadge.className = 'badge waiting'
  }
  if (bgBlur) bgBlur.style.background = ''
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

  while (lyricsList.firstChild) lyricsList.removeChild(lyricsList.firstChild)

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
        window.opener?.postMessage({ type: 'SEEK_TO', payload: { time: line.time as number } }, '*')
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

refreshBtn?.addEventListener('click', async () => {
  if (!currentVideoData) return
  refreshBtn.classList.add('spinning')
  refreshBtn.disabled = true
  window.opener?.postMessage({ type: 'VIDEO_CHANGED', payload: currentVideoData }, '*')
  setTimeout(() => {
    refreshBtn.classList.remove('spinning')
    refreshBtn.disabled = false
  }, 1500)
})

let pendingVideoId: string | null = null

window.addEventListener('message', (e: MessageEvent) => {
  console.log('[Overlay] Message received:', e.data?.type, e.origin)
  const message = e.data as MessageType
  switch (message.type) {
    case 'VIDEO_CHANGED': {
      console.log('[Overlay] VIDEO_CHANGED:', message.payload)
      currentVideoData = message.payload
      pendingVideoId = message.payload.videoId
      break
    }

    case 'LYRICS_READY': {
      console.log('[Overlay] LYRICS_READY:', message.payload?.status)
      currentLyrics = message.payload
      currentLineIndex = -1

      if (message.payload.status === 'not_music') {
        pendingVideoId = null
        resetToIdle()
        break
      }

      if (pendingVideoId) {
        updateThumbnail(pendingVideoId)
        pendingVideoId = null
      }

      renderLyrics(message.payload)
      break
    }

    case 'TIME_UPDATE': {
      updateHighlight(message.payload.currentTime)
      break
    }
  }
})

showIdleState()

chrome.runtime.sendMessage({ type: 'OVERLAY_READY' }).catch(() => {})