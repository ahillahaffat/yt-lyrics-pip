import { MessageBus } from '@/infrastructure/MessageBus'
import { LyricsService } from '@/services/LyricsService'
import type { MessageType, VideoData } from '@/types'

export default defineBackground(() => {
  async function sendToYouTubeTabs(message: MessageType): Promise<void> {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' })
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {})
      }
    }
  }

  MessageBus.listen(async (message: MessageType) => {
    switch (message.type) {
      case 'EXTENSION_TOGGLED': {
        await sendToYouTubeTabs(message)
        break
      }

      case 'VIDEO_CHANGED': {
        console.log('[BG] VIDEO_CHANGED:', message.payload)
        await sendToYouTubeTabs({ type: 'VIDEO_CHANGED', payload: message.payload })
        const lyrics = await LyricsService.getForVideo(message.payload as VideoData)
        console.log('[BG] lyrics fetched:', lyrics.status)
        await sendToYouTubeTabs({ type: 'LYRICS_READY', payload: lyrics })
        break
      }

      case 'TIME_UPDATE': {
        break
      }
    }
  })

  console.log('[BG] service worker initialized')
})