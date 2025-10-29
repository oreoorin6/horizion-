# Changelog

All notable changes to this project will be documented here.

## Unreleased
- Add “Reveal in Explorer” action for completed downloads (planned)
- Optional resumable downloads via HTTP Range (planned)

## 1.0.0
- Downloads: Switched from mock timers to real Electron‑based downloads (HTTPS stream → disk)
  - Progress, completion, cancel events over IPC
  - Unique filename collision handling
  - Configurable download directory with absolute/relative semantics
- Folder picker: Native Windows folder picker to choose and persist download location
- Packaging: Enabled Windows portable target (standalone EXE) in electron‑builder
- Settings UX: 
  - Settings modal content scrolls vertically
  - Tabs bar constrained to horizontal scrolling only
- Build reliability:
  - Self‑healing scripts to repair broken installs
  - Faster electron‑builder path by avoiding unnecessary signing downloads
- Dependency upgrades: Updated major dependencies and added restore tooling
- Production behavior: DevTools gated to development only
- Repo organization: Consolidated docs and removed stale duplicates
- API client & requests:
  - Respectful pacing around e621 rate limits (~1 req/sec)
  - Caching/debouncing to avoid duplicate calls
