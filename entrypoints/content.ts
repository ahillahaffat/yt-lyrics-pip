import { MessageBus } from '@/infrastructure/MessageBus'
import type { MessageType } from '@/types'

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',

  async main() {
    console.log('[CS] Content script loaded')

    await injectScript('/content-mainworld.js', { keepInDom: true })
    console.log('[CS] Main world script injected')

    window.addEventListener('yt-lyrics-to-isolated', (e: any) => {
      const { type, payload } = e.detail
      console.log('[CS] From main world:', type)

      if (type === 'VIDEO_CHANGED') {
        MessageBus.send({ type: 'VIDEO_CHANGED', payload })
      }
      if (type === 'TIME_UPDATE') {
        MessageBus.send({ type: 'TIME_UPDATE', payload })
      }
    })

    MessageBus.listen((message: MessageType) => {
      if (message.type === 'SEEK_TO') {
        window.dispatchEvent(new CustomEvent('yt-lyrics-to-main', {
          detail: { type: 'SEEK_TO', payload: message.payload }
        }))
      }
    })
  }
})
