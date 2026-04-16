# ChaseCatcher 🎯

<div align="center">

![ChaseCatcher Logo](./public/icons/icon128.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/platform-Chrome-green.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue)

</div>

A Chrome extension that automatically activates Chase credit card rewards with a single click. Save time and never miss a cashback opportunity!

## 🌟 Features

- **One-Click Activation**: Automatically activate all available Chase credit card offers
- **Smart Detection**: Intelligently identifies and processes only unadded offers
- **Progress Tracking**: Real-time feedback on offer activation progress
- **Performance Optimized**: Fast and efficient with smart timing algorithms
- **Secure & Private**: Works entirely in your browser with no data collection

## 🚀 Installation

### From Chrome Web Store
1. Visit the [ChaseCatcher Chrome Web Store page](https://chrome.google.com/webstore/detail/chasecatcher/YOUR_EXTENSION_ID)
2. Click "Add to Chrome"
3. Confirm the installation

### From Source
1. Clone this repository
```bash
git clone git@github.com:dimalama/chase-catcher.git
```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the cloned repository folder

## 💻 Usage

1. Navigate to your Chase credit card offers page
2. Click the ChaseCatcher icon in your browser toolbar
3. Click "Start Catching" to begin automatically activating offers
4. Watch as ChaseCatcher efficiently processes all available offers

## 🔒 Privacy & Security

- No data collection or storage
- Works entirely within your browser
- No external communication
- Open source for transparency
- [View our Privacy Policy](store_assets/privacy_policy.md)

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone git@github.com:dimalama/chase-catcher.git
cd chase-catcher
npm install
npm run build
npm test
```

### Available Scripts
- `npm run build` — Production build
- `npm run watch` — Rebuild on file changes
- `npm test` — Run tests with coverage
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — Lint source files
- `npm run package` — Build and create a `.zip` for submission

### Project Structure
```
chase-catcher/
├── manifest.json          # MV3 extension manifest
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
├── dist/                  # Compiled output (gitignored)
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

## 🙏 Acknowledgments

- Thanks to all contributors who have helped make ChaseCatcher better especially to my girlfriend who inspired me to make this thing

---
<div align="center">
Made with ❤️ by dimalama
</div>
