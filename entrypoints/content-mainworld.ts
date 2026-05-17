export default defineUnlistedScript(() => {
  async function waitForPlayer(timeout = 10000): Promise<any> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const el = document.querySelector('#movie_player') as any
      if (el && typeof el.getVideoData === 'function') return el
      await new Promise(r => setTimeout(r, 300))
    }
    return null
  }

  async function init() {
    const player = await waitForPlayer()
    if (!player) {
      console.warn('[MAIN] Player not found')
      return
    }

    console.log('[MAIN] Player ready:', player.getVideoData())

    function sendToIsolated(type: string, payload: any) {
      window.dispatchEvent(new CustomEvent('yt-lyrics-to-isolated', {
        detail: { type, payload }
      }))
    }

    window.addEventListener('yt-lyrics-to-main', (e: any) => {
      const { type, payload } = e.detail
      if (type === 'SEEK_TO') {
        player.seekTo(payload.time, true)
      }
      if (type === 'GET_VIDEO_DATA') {
        const data = player.getVideoData()
        sendToIsolated('VIDEO_DATA', data)
      }
    })

    let currentVideoId: string | null = null

    setInterval(() => {
      const data = player.getVideoData()
      if (!data?.video_id) return
      if (data.video_id === currentVideoId) return
      currentVideoId = data.video_id
      sendToIsolated('VIDEO_CHANGED', {
        videoId: data.video_id,
        title: data.title ?? '',
        author: data.author ?? ''
      })
    }, 500)

    setInterval(() => {
      sendToIsolated('TIME_UPDATE', {
        currentTime: player.getCurrentTime()
      })
    }, 200)
  }

  init()
})
