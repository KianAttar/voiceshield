# VoiceShield

Electron desktop app that anonymizes voices in video files using FFmpeg. Fully offline.

## Stack

- **electron-vite v3** scaffold — main, preload, renderer
- **React 18 + Tailwind CSS v4** (`@tailwindcss/vite`, `@import 'tailwindcss'`)
- **TypeScript strict** — `strict: true`, `noImplicitAny`, no `any`, no `@ts-ignore`
- **pnpm** exclusively (no npm/yarn)
- **Vitest** + happy-dom + React Testing Library + jest-dom
- **electron-builder** — DMG (mac), NSIS (win), unsigned (`identity: null`)

## Architecture

```
src/
  shared/       — types.ts (interfaces), ipcChannels.ts (IPC const + type)
  main/         — index.ts (window), ipc.ts (handlers), ffmpeg.ts (processing)
  preload/      — index.ts (contextBridge typed API)
  renderer/
    App.tsx     — wires hooks + components, no business logic
    hooks/      — useFileQueue, useSettings, useProcessing
    components/ — DropZone, PresetCard, AdvancedPanel, FileQueueItem,
                  ProgressBar, StatusBadge, Tooltip, WelcomeOverlay
docs/           — GitHub Pages landing site (index.html + style.css)
.github/workflows/
  build.yml     — matrix build (mac+win) on v* tags, GitHub Release
  pages.yml     — deploy docs/ to Pages on push to main
```

## Key patterns

- IPC channels defined once in `src/shared/ipcChannels.ts` as `const` object
- FFmpeg filter: `rubberband=pitch=X:formant=Y` with `asetrate/atempo/aresample` fallback
- Pitch stored as semitones [-8, +8], converted via `Math.pow(2, semitones / 12)`
- Formant clamped [0.8, 1.4]
- File queue deduplicates by path
- Sequential processing via refs to avoid stale closures
- `-webkit-app-region: drag` on body, `no-drag` on interactive elements (DropZone, buttons, inputs)
- Tooltip uses portal + useLayoutEffect for viewport-aware positioning

## Tests

107 tests across 11 files. Coverage thresholds: 80/80/75 (statements/branches/functions).

## Commands

```
pnpm dev          # dev mode
pnpm test         # run tests
pnpm typecheck    # tsc --noEmit
pnpm build:mac    # package .dmg
pnpm build:win    # package .exe
```

## GitHub

- Repo: github.com/KianAttar/voiceshield
- Pages: kianattar.github.io/voiceshield
- Download links on landing page fetch latest artifact URLs from GitHub API
