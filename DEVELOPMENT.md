# ChaseCatcher Development Guide

## Prerequisites
- Node.js 22.18+ or 24.11+ (required by Babel 8)
- npm
- At least one of: Chrome/Chromium, Firefox 128+, or a Mac with Xcode for Safari

## Setup
```bash
git clone https://github.com/dimalama/chase-catcher.git
cd chase-catcher
npm install
npm run build
```

## How the build works
```
src/**/*.ts ──webpack + Babel──▶ dist/{background,content,popup}.js
manifest.json + dist/ + public/ ──config/build-targets.js──▶ build/chrome
                                                              build/firefox
                                                              build/safari
```
There is one shared `manifest.json`. `config/build-targets.js` adjusts it per browser:

| Target | Background | Other changes |
|---|---|---|
| chrome | `service_worker` | drops Firefox-only `browser_specific_settings` |
| firefox | `scripts` (event page) | drops `minimum_chrome_version` |
| safari | `scripts`, `persistent: false` | drops `notifications` (unsupported) and browser-specific keys |

All code talks to the browser through `webextension-polyfill` (`browser.*`), which maps to native
`browser` on Firefox and Safari and wraps `chrome` on Chromium. APIs missing on some platforms
(`notifications` on Safari, `commands` on iOS/Android) are feature-checked before use.

## Scripts
| Command | What it does |
|---|---|
| `npm run build` | Compile and write `build/<browser>/` |
| `npm run watch` | Recompile `dist/` on change (rerun `node config/build-targets.js` to refresh `build/`) |
| `npm test` | Jest unit + integration tests with coverage |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run lint:firefox` | Mozilla `web-ext lint` on `build/firefox` |
| `npm run package` | Clean build + `chase-catcher-{chrome,firefox,safari}.zip` |
| `npm run safari:xcode` | (macOS) Wrap `build/safari` in an Xcode project for macOS + iOS |

## Loading the extension
- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → `build/chrome`
- **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `build/firefox/manifest.json`
- **Safari:** see the README's Safari section

## Debugging
- **Content script:** DevTools console on the Chase offers page
- **Background:** Chrome: "service worker" link on the extension card. Firefox: "Inspect" in `about:debugging`. Safari: Develop menu → Web Extension Background Content
- **Popup:** right-click the popup → Inspect (Chrome/Firefox); Develop menu in Safari
- **iPhone/iPad:** connect the device, enable Web Inspector in Safari settings on the device, and use the Mac's Safari Develop menu

## Cross-browser gotchas
- Firefox and Safari can withhold host access to `secure.chase.com`; the content script then never runs.
  The popup detects this and requests access on the Start click. `permissions.request` must be called
  before any `await` in a click handler or Firefox rejects it.
- Safari hides `tab.url` when the extension lacks site access, so URL checks must tolerate `undefined`.
- When you change the disclaimer text materially, bump `DISCLAIMER_VERSION` in `src/utils/disclaimer.ts`
  so users re-accept.

## Release checklist
- [ ] Bump `version` in `manifest.json` and `package.json`
- [ ] `npm run package` and smoke-test each zip
- [ ] Chrome Web Store: upload `chase-catcher-chrome.zip`
- [ ] Firefox AMO: upload `chase-catcher-firefox.zip`
- [ ] Safari: `npm run safari:xcode`, archive in Xcode, upload to App Store Connect
