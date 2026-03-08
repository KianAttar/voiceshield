# VoiceShield

Desktop app that anonymizes voices in video files. 100% local processing — nothing is uploaded anywhere.

## Features

- **Drag and drop** — Drop one or multiple video files. Supports MP4, MKV, MOV, and WebM.
- **Three presets** — Subtle, Moderate, or Strong anonymization.
- **Advanced controls** — Fine-tune pitch, formant shift, and add robotic or echo effects.
- **Completely offline** — All audio processing runs locally via FFmpeg.

## Download

Grab the latest release from the [releases page](https://github.com/KianAttar/voiceshield/releases/latest) or visit [kianattar.github.io/voiceshield](https://kianattar.github.io/voiceshield/).

### macOS note

Since the app is not code-signed, macOS may show an "app is damaged" warning. Run this once in Terminal:

```
xattr -cr /Applications/VoiceShield.app
```

## Development

Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start in development mode |
| `pnpm build` | Build renderer and main process |
| `pnpm build:mac` | Build + package macOS .dmg |
| `pnpm build:win` | Build + package Windows .exe |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm typecheck` | TypeScript type check |

## Tech stack

- Electron + electron-vite
- React 18 + Tailwind CSS v4
- TypeScript (strict mode)
- FFmpeg (bundled via ffmpeg-static)
- Vitest + React Testing Library
- electron-builder for packaging

## License

[MIT](LICENSE)
