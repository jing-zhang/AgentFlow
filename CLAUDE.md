# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

AgentFlow is an Electron desktop app that monitors and controls systemd user services (OpenClaw and Hermes agents). It uses a three-layer architecture:

- **Main process** (`main.js`): Electron BrowserWindow with frameless/transparent window, IPC handlers for service control, window resize persistence
- **Preload bridge** (`preload.js`): contextBridge exposing `electronAPI` to renderer — the sole IPC boundary
- **Renderer** (`renderer.js` + `index.html` + `style.css`): glassmorphism UI with three tabs (Overview, Logs, Settings), responsive layout system, localStorage-based preferences

The `service-manager.js` module wraps `child_process.exec` to call `systemctl --user` and `journalctl --user` commands.

### Key design decisions
- Frameless window (370×565 default, min 370×400, max 740×800) with custom title bar and macOS-style traffic light controls
- Window size/position saved to `userData/window-preferences.json` via main process
- UI preferences (selected agent, compact mode) persisted via `localStorage` in renderer
- Service names are mappable: internal identifiers (`openclaw`, `hermes`) → configurable systemd unit names
- Responsive layout with three modes: compact (≤370px), single-column (≤500px), grid (>500px)
- Electron's sandbox enabled, `contextIsolation: true`, `nodeIntegration: false`

## Commands

```bash
npm start          # Launch the Electron app
npm test           # Run all Jest tests
npm test -- --watch  # Run tests in watch mode
npm run build:linux   # Build both .deb and AppImage
npm run build:deb     # Build .deb package only
npm run build:appimage # Build AppImage only
```

## Tests

Jest tests are in `test/`. The test suite mocks `child_process.exec` to avoid depending on systemd:

- `test/unit.test.js` — Unit tests for `service-manager.js` (status checks, service control, log fetching)
- `test/integration.test.js` — Integration tests for service name mapping and workflows
- `test/ui-preferences.test.js` — UIPreferences and WindowSizeManager tests (jsdom-based)
- `test/window-size.test.js` — Window resize and preference persistence tests
- `test/card-scaling.test.js` — Card layout and responsive scaling tests
- `test/agent-toggle-final.test.js` — Agent toggle component tests
- `test/activity-monitor.test.js` — Activity monitor chart tests
- `test/agent-switching-integration.test.js` — Full agent switching workflow tests

## Project structure

```
main.js              # Electron main process — window creation, IPC handlers
preload.js           # Context bridge — exposes electronAPI to renderer
renderer.js          # Renderer logic — status polling, tab switching, settings, UI prefs
index.html           # HTML structure — two agent cards, activity monitor, logs, settings
style.css            # Glassmorphism dark theme, responsive layout (3 breakpoints)
service-manager.js   # systemd wrapper — singleton, exec-based service control
dist/                # Build output (deb, AppImage)
test/                # Jest test suite (all mock child_process.exec)
```

## Service model

Each agent is a systemd user service controlled via:
- `systemctl --user is-active <unit>` → returns `active | inactive | not-installed | error`
- `systemctl --user start|stop|restart <unit>`
- `journalctl --user -u <unit> -n <lines> --no-pager -o short-precise` → log fetching
