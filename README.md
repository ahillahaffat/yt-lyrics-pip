# yt-lyrics-pip

# yt-lyrics-pip

A Chrome extension that displays synced lyrics in a floating Picture-in-Picture window while watching YouTube.

Built with [WXT](https://wxt.dev) + TypeScript + PNPM.

---

## Features

- **Synced lyrics** — lyrics scroll and highlight in real time as the song plays, powered by [LRCLIB](https://lrclib.net)
- **Document Picture-in-Picture** — lyrics float in a separate always-on-top window, separate from the YouTube tab
- **Click-to-seek** — click any lyric line to jump to that timestamp
- **Album art + dynamic color** — album cover is shown with a dynamic background color extracted from the thumbnail
- **Lyrics caching** — fetched lyrics are cached locally for 7 days to avoid redundant API calls
- **Non-music detection** — automatically skips podcasts, match highlights, and non-music content
- **Manual enable/disable** — toggle the extension on or off from the popup without touching YouTube's UI

---

## How It Works

```
YouTube page (main world)
  └── Polls YouTube player for video data and timestamps
        └── Dispatches CustomEvents to isolated world

Content script (isolated world)
  └── Receives events, forwards to background via MessageBus
        └── Background fetches lyrics from LRCLIB
              └── Sends LYRICS_READY back to content script
                    └── Content script relays to PiP window via postMessage
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PNPM
- Chrome 116+ (Document PiP API required)

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Load `.output/chrome-mv3` as an unpacked extension in `chrome://extensions`.

### Production Build

```bash
pnpm build
```

---

## Usage

1. Install the extension
2. Click the extension icon and press **Enable Lyrics**
3. Go to YouTube and play a music video
4. Click the **🎵 Lyrics** button (bottom-right of the page)
5. A Picture-in-Picture window will open with synced lyrics

To close, click **✕ Close** or close the PiP window directly.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Build | [WXT](https://wxt.dev) + Vite |
| Language | TypeScript |
| Lyrics API | [LRCLIB](https://lrclib.net) |
| Storage | Chrome Storage API |
| PiP | Document Picture-in-Picture API |

---

## Project Structure

```
entrypoints/
  background.ts         # Service worker — lyrics fetching, message routing
  content.ts            # Isolated world — PiP lifecycle, message bridge
  content-mainworld.ts  # Main world — YouTube player polling
  overlay/
    index.ts            # PiP window logic
    index.html
    style.css
  popup/
    main.ts             # Enable/disable toggle
    index.html

infrastructure/
  MessageBus.ts
  StorageAdapter.ts

services/
  LyricsService.ts

parsers/
  LRCParser.ts

utils/
  contentFilter.ts      # Music vs non-music detection
  titleParser.ts        # Extract track name and artist from YouTube title
```

---

## License

MIT