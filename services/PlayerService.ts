interface YouTubePlayerElement extends HTMLElement {
  getVideoData(): { video_id: string; title: string; author: string } | null
  getCurrentTime(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
}

export const PlayerService = {
  getPlayer(): YouTubePlayerElement | null {
    const el = document.querySelector('#movie_player') as YouTubePlayerElement | null
    if (!el || typeof el.getVideoData !== 'function') return null
    return el
  },

  async waitForPlayer(timeout = 10000): Promise<YouTubePlayerElement | null> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const player = this.getPlayer()
      if (player) return player
      await new Promise(r => setTimeout(r, 300))
    }
    return null
  },

  getVideoData() {
    return this.getPlayer()?.getVideoData() ?? null
  },

  getCurrentTime(): number {
    return this.getPlayer()?.getCurrentTime() ?? 0
  },

  seekTo(time: number): void {
    this.getPlayer()?.seekTo(time, true)
  }
}