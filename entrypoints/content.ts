import { MessageBus } from '@/infrastructure/MessageBus'
import type { MessageType } from '@/types'

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',

  async main() {
    console.log('[CS] Content script loaded')

    await injectScript('/content-mainworld.js', { keepInDom: true })
    console.log('[CS] Main world script injected')

    let pipWindow: Window | null = null
    let lastVideoChanged: MessageType | null = null
    let lastLyricsReady: MessageType | null = null

    window.addEventListener('yt-lyrics-to-isolated', (e: any) => {
      const { type, payload } = e.detail
      if (type === 'VIDEO_CHANGED') {
        MessageBus.send({ type: 'VIDEO_CHANGED', payload })
      }
      if (type === 'TIME_UPDATE') {
        MessageBus.send({ type: 'TIME_UPDATE', payload })
        pipWindow?.postMessage({ type: 'TIME_UPDATE', payload }, '*')
      }
    })

    MessageBus.listen((message: MessageType) => {
      if (message.type === 'SEEK_TO') {
        window.dispatchEvent(new CustomEvent('yt-lyrics-to-main', {
          detail: { type: 'SEEK_TO', payload: message.payload }
        }))
      }
    })

function injectToggleButton(): void {
  const btn = document.createElement('button')
  btn.id = 'yt-lyrics-pip-btn'
  btn.textContent = '🎵 Lyrics'
  btn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 9999;
    background: #E82684;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    // box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  `

  btn.addEventListener('click', async () => {
    if (pipWindow && !pipWindow.closed) {
      closePiP()
      btn.textContent = '🎵 Lyrics'
    } else {
      await openPiP()
      btn.textContent = '✕ Close'
    }
  })

  document.body.appendChild(btn)
}

injectToggleButton()

    async function openPiP(): Promise<void> {
      if (pipWindow && !pipWindow.closed) return

      try {
        // @ts-ignore
        const pip = await documentPictureInPicture.requestWindow({
          width: 360,
          height: 600,
        }) as Window

        pipWindow = pip

        const overlayHtml = await fetch(chrome.runtime.getURL('overlay.html')).then(r => r.text())
        const parser = new DOMParser()
        const doc = parser.parseFromString(overlayHtml, 'text/html')

        const cssLink = doc.querySelector('link[rel="stylesheet"]')
        const cssHref = cssLink?.getAttribute('href')
        console.log('[CS] cssHref:', cssHref)

        if (cssHref) {
          const style = pip.document.createElement('link')
          style.rel = 'stylesheet'
          style.href = chrome.runtime.getURL(cssHref.replace(/^\//, ''))
          pip.document.head.appendChild(style)
        }

        const appEl = doc.getElementById('app')
        if (appEl) pip.document.body.appendChild(appEl)

        const jsScript = doc.querySelector('script[type="module"]')
        const jsSrc = jsScript?.getAttribute('src')
        console.log('[CS] jsSrc:', jsSrc)

        if (jsSrc) {
          const script = pip.document.createElement('script')
          script.type = 'module'
          script.src = chrome.runtime.getURL(jsSrc.replace(/^\//, ''))
          pip.document.head.appendChild(script)
        }

        setTimeout(() => {
          if (lastVideoChanged) {
            pip.postMessage({ type: 'VIDEO_CHANGED', payload: (lastVideoChanged as any).payload }, '*')
          }
          if (lastLyricsReady) {
            pip.postMessage({ type: 'LYRICS_READY', payload: (lastLyricsReady as any).payload }, '*')
          }
        }, 800)

        pip.addEventListener('message', (e: MessageEvent) => {
          if (e.data?.type === 'SEEK_TO') {
            window.dispatchEvent(new CustomEvent('yt-lyrics-to-main', {
              detail: { type: 'SEEK_TO', payload: e.data.payload }
            }))
          }
        })

        pip.addEventListener('pagehide', () => {
          pipWindow = null
        })

        console.log('[CS] Document PiP opened')

      } catch (err) {
        console.error('[CS] Document PiP failed:', err)
      }
    }

    function closePiP(): void {
      pipWindow?.close()
      pipWindow = null
    }

    chrome.runtime.onMessage.addListener((message) => {
      console.log('[CS] Message received:', message.type)

      if (message.type === 'LYRICS_READY') {
        lastLyricsReady = message
        pipWindow?.postMessage({ type: 'LYRICS_READY', payload: message.payload }, '*')
      }

      if (message.type === 'VIDEO_CHANGED') {
        lastVideoChanged = message
        pipWindow?.postMessage({ type: 'VIDEO_CHANGED', payload: message.payload }, '*')
      }
    })
  }
})