import { defineConfig } from 'wxt'
import { resolve } from 'path'

export default defineConfig({
  manifest: {
    name: 'YT Lyrics 0.1',
    short_name: 'YTLyrics',
    description: 'Floating synced lyrics for YouTube music videos with Picture-in-Picture support.',
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: [
      'https://www.youtube.com/*',
      'https://lrclib.net/*'
    ],
    web_accessible_resources: [
      {
        resources: [
          'overlay.html',
          'overlay/index.html',
          'assets/*.css',
          'assets/*.js',
          'chunks/*.js',
          'content-mainworld.js',
          '*.svg',
          '*.png'
        ],
        matches: ['https://www.youtube.com/*']
      }
    ]
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': resolve(__dirname, '.')
      }
    }
  })
})