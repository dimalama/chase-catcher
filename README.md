# ChaseCatcher 🎯

<div align="center">

![ChaseCatcher Logo](./public/icons/icon128.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Firefox%20%7C%20Safari-green.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue)

</div>

A browser extension that automatically activates Chase credit card rewards with a single click. Works in Chrome (and other Chromium browsers), Firefox (desktop and Android), and Safari (macOS, iPhone, and iPad).

> ⚠️ **Use at your own risk.** Chase Catcher is not affiliated with Chase. You are solely responsible for how you use it, and the author accepts no liability. See the [Disclaimer](DISCLAIMER.md).

## 🌟 Features

- **One-Click Activation**: Automatically activate all available Chase credit card offers
- **Smart Detection**: Intelligently identifies and processes only unadded offers
- **Progress Tracking**: Real-time feedback on offer activation progress
- **Performance Optimized**: Fast and efficient with smart timing algorithms
- **Secure & Private**: Works entirely in your browser with no data collection

## 🌐 Browser Support

| Browser | Status | Build folder | Notes |
|---|---|---|---|
| Chrome, Edge, Brave, Opera | ✅ | `build/chrome` | Chrome 109+ |
| Firefox desktop | ✅ | `build/firefox` | Firefox 128+ |
| Firefox for Android | ✅ | `build/firefox` | Firefox 128+, no keyboard shortcuts |
| Safari on macOS | ✅ | `build/safari` | Needs an Xcode wrapper app (see below) |
| Safari on iPhone / iPad | ✅ | `build/safari` | Same Xcode project, no keyboard shortcuts or notifications |

All browsers share one codebase. `npm run build` compiles the TypeScript and writes one folder per browser with the right `manifest.json` for each (Chrome uses a service worker, Firefox an event page, Safari a non-persistent background page without notifications).

## 🚀 Installation

First build the extension:

```bash
git clone git@github.com:dimalama/chase-catcher.git
cd chase-catcher
npm install
npm run build
```

### Chrome (and Edge, Brave, Opera)
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked" and select `build/chrome`

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on…" and select `build/firefox/manifest.json`
3. If Firefox asks for access to `secure.chase.com`, allow it. If you skipped it, click **Start Catching** in the popup and approve the prompt, then reload the Chase page.

Temporary add-ons are removed when Firefox restarts. For a permanent install, submit `chase-catcher-firefox.zip` (from `npm run package`) to [addons.mozilla.org](https://addons.mozilla.org/developers/), either listed or self-distributed (signed but unlisted).

### Safari (macOS, iPhone, iPad)
Safari extensions must ship inside a native app, so this step needs a Mac with Xcode.

1. Run `npm run build && npm run safari:xcode`. This calls Apple's `safari-web-extension-converter` and creates an Xcode project in `safari-xcode/` with macOS and iOS targets.
2. Open the project in Xcode, set your Team under *Signing & Capabilities* for every target.
3. **Mac:** run the macOS scheme, then in Safari open *Settings → Extensions* and enable Chase Catcher. For unsigned local builds, first enable *Develop → Allow Unsigned Extensions*.
4. **iPhone / iPad:** connect the device, select the iOS scheme and run it. Then on the device open *Settings → Apps → Safari → Extensions*, enable Chase Catcher, and set *secure.chase.com* to **Allow**.
5. In Safari, open the Chase offers page, tap the **ᴀA** (or puzzle) icon in the address bar, and choose Chase Catcher.

A free Apple ID can install on your own devices, but the app expires after 7 days. Publishing to the App Store needs a paid Apple Developer account.

## 💻 Usage

1. Navigate to your Chase credit card offers page
2. Click the ChaseCatcher icon in your browser toolbar (on iPhone: the **ᴀA** menu in Safari)
3. The first time, read the disclaimer and click **I understand and accept**
4. Click "Start Catching" to begin automatically activating offers
5. Watch as ChaseCatcher efficiently processes all available offers

Keyboard shortcuts (desktop only): `Ctrl+Shift+Y` opens the popup, `Ctrl+Shift+H` starts or stops hunting.

## 🔒 Privacy & Security

- No data collection or storage
- Works entirely within your browser
- No external communication
- Open source for transparency
- Stores only a local offer counter and your disclaimer acceptance

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm

### Available Scripts
- `npm run build` — Compile and write `build/chrome`, `build/firefox`, `build/safari`
- `npm run watch` — Rebuild on file changes
- `npm test` — Run tests with coverage
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — Lint source files
- `npm run package` — Build and create `chase-catcher-{chrome,firefox,safari}.zip` for store submission
- `npm run lint:firefox` — Validate the Firefox build with Mozilla's `web-ext lint`
- `npm run safari:xcode` — (macOS) Generate the Safari Xcode project from `build/safari`

### Project Structure
```
chase-catcher/
├── manifest.json          # Shared MV3 manifest (per-browser variants are generated)
├── DISCLAIMER.md          # Terms of use and liability disclaimer
├── public/
│   ├── popup.html         # Extension popup UI
│   └── icons/             # Extension icons (16, 48, 128)
├── src/js/
│   ├── content.ts         # Core offer detection & activation
│   ├── popup.ts           # Popup logic & UI binding
│   ├── background.ts      # Service worker & notifications
│   └── types.ts           # Shared TypeScript interfaces
├── src/__tests__/         # Jest unit & integration tests
├── config/                # Webpack, Jest, ESLint, Prettier configs
│   └── build-targets.js   # Generates build/<browser>/ from manifest.json
├── dist/                  # Compiled JS (gitignored)
├── build/                 # Loadable extension per browser (gitignored)
└── store_assets/          # Chrome Web Store assets (gitignored)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This extension is not affiliated with, endorsed by, or connected to JPMorgan Chase & Co. or any of its subsidiaries.

Chase Catcher is provided **"as is", without warranty of any kind**. It automates clicks in your own Chase account, which may conflict with Chase's terms of use. **You use it entirely at your own risk and are solely responsible for how you use it.** The author is not liable for any loss or damage arising from its use, including account restrictions, missed or incorrect offers, or financial loss. The extension asks every user to accept these terms before it can run.

Read the full [Disclaimer](DISCLAIMER.md).

## 🙏 Acknowledgments

- Thanks to all contributors who have helped make ChaseCatcher better especially to my girlfriend who inspired me to make this thing

---
<div align="center">
Made with ❤️ by dimalama
</div>
