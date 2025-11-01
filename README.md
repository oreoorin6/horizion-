# E621 Horizon

A modern desktop app for browsing e621.net built with Next.js, TypeScript, and Electron.

## Quick start

Windows PowerShell:

```powershell
# Install deps (recommended script)
./build/install-dependencies.ps1

# Run Next.js + Electron together
npm run electron-dev
```

## Build (Windows)

```powershell
# Build web + package Electron (no publish)
npm run dist

# Artifacts output to ./dist
# Includes a portable EXE: E621-Horizon-<version>-portable.exe
```

## Basics

- Downloads: set your folder in Settings or the Download Panel ("Browse…" uses the native Windows folder picker). If you specify a relative path, it resolves under your OS Downloads directory. Filenames are made collision‑safe.
- Auth: e621 username + API key. Stored locally in browser/Electron localStorage only.
- DevTools: enabled in development, disabled in production.
- Rate limits: paced around e621’s ~1 req/sec guideline.

## Docs

- FAQ: see [docs/FAQ.md](./docs/FAQ.md)
- API references: see [docs/API_REFERENCES.md](./docs/API_REFERENCES.md)
- Code signing (self-signing): see [docs/SIGNING.md](./docs/SIGNING.md)
- Updates: see [CHANGELOG.md](./CHANGELOG.md)

## License and contributing

MIT License. Contributions welcome via PRs.

Not affiliated with e621.net. Please respect their terms and API guidelines.