# FAQ

A quick reference for common questions about E621 Horizon.

## Where are my login credentials stored?
- Location: Browser/Electron localStorage on your device only.
- Keys:
  - e621: `e621horizon_credentials` with `{ username, apiKey }`
  - FurAffinity (if used): `fa_credentials` with `{ cookie_a, cookie_b }`
- Applied via HTTP headers in the API client when you’re logged in.
- Clear anytime via Settings → Account (or use the in‑app Logout).
- In Electron, localStorage persists under: `%AppData%/E621 Horizon` on Windows.

## What’s the default download location?
- If you set an absolute path, files save there directly.
- If you set a relative path, it resolves under your OS Downloads folder.
- Filenames are made collision‑safe automatically (we add a numeric suffix instead of overwriting).

## How do I change the download folder?
- Open Settings or the Download Panel and click “Browse…”.
- This opens the native Windows folder picker; your choice is saved for future downloads.

## Are downloads resumable?
- Not yet. Cancelled or interrupted downloads currently restart from the beginning.
- Resume support (HTTP Range) is on the roadmap.

## What’s the API rate limit?
- We pace requests around the e621 guideline of ~1 request per second.
- The client includes caching and debouncing to avoid duplicate calls.

## Does the portable EXE work without installation?
- Yes. We ship a portable build: `E621-Horizon-<version>-portable.exe` in `dist/`.
- It runs without installation; settings still persist under your user data directory.

## How do I run the app in development?
- Start Next.js + Electron together:
  - `npm run electron-dev`
- Next dev server runs on `http://localhost:3000` and Electron launches once it’s ready.

## How do I build the app?
- Build and package (no publish):
  - `npm run dist`
- Artifacts are placed under `dist/` (including the portable EXE on Windows).

## Where are DevTools?
- DevTools open only in development. They are disabled in production builds.

## Where can I report issues?
- Open an issue on GitHub with steps to reproduce and your logs/environment. If possible, include the app version, Windows version, and a small repro.
