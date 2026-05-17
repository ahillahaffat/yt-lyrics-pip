import { MessageBus } from '@/infrastructure/MessageBus'
import { LyricsService } from '@/services/LyricsService'
import type { MessageType, VideoData } from '@/types'

export default defineBackground(() => {
  let overlayWindowId: number | null = null
  let overlayTabId: number | null = null
  let pendingLyrics: MessageType | null = null

  async function openOverlayWindow(): Promise<void> {
    if (overlayWindowId !== null) return

    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('overlay.html'),
      type: 'popup',
      width: 360,
      height: 600,
      top: 100,
      left: 100,
    })

    overlayWindowId = win?.id ?? null

    if (win?.tabs && win.tabs.length > 0) {
      overlayTabId = win.tabs[0].id ?? null
    }

    if (pendingLyrics && overlayTabId !== null) {
      setTimeout(() => {
        sendToOverlay(pendingLyrics!)
        pendingLyrics = null
      }, 1000)
    }
  }

  function sendToOverlay(message: MessageType): void {
    if (overlayTabId === null) {
      if (message.type === 'LYRICS_READY') pendingLyrics = message
      return
    }
    chrome.tabs.sendMessage(overlayTabId, message).catch(() => {
      if (message.type === 'LYRICS_READY') pendingLyrics = message
    })
  }

  chrome.windows.onRemoved.addListener((windowId: number) => {
    if (windowId === overlayWindowId) {
      overlayWindowId = null
      overlayTabId = null
    }
  })

  MessageBus.listen(async (message: MessageType) => {
    switch (message.type) {
      case 'EXTENSION_TOGGLED': {
        if (message.payload.active) {
          await openOverlayWindow()
        } else {
          if (overlayWindowId !== null) {
            await chrome.windows.remove(overlayWindowId)
            overlayWindowId = null
            overlayTabId = null
          }
        }
        break
      }

      case 'VIDEO_CHANGED': {
        console.log('[BG] VIDEO_CHANGED:', message.payload)
        sendToOverlay({ type: 'VIDEO_CHANGED', payload: message.payload })
        const lyrics = await LyricsService.getForVideo(message.payload as VideoData)
        console.log('[BG] lyrics fetched:', lyrics.status)
        sendToOverlay({ type: 'LYRICS_READY', payload: lyrics })
        break
      }

      case 'TIME_UPDATE': {
        sendToOverlay(message)
        break
      }
    }
  })

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'OVERLAY_READY' && pendingLyrics) {
      setTimeout(() => {
        sendToOverlay(pendingLyrics!)
        pendingLyrics = null
      }, 200)
    }
  })

  console.log('[BG] service worker initialized')
})