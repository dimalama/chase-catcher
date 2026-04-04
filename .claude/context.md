# ChaseCatcher - Project Context

## Overview
ChaseCatcher is a Chrome extension (Manifest V3) that automatically activates Chase credit card offers with a single click. It helps users save time and never miss cashback opportunities.

## Tech Stack
- **Platform**: Chrome Extension (Manifest V3)
- **Language**: JavaScript
- **Build Tool**: Webpack 5
- **Testing**: Jest with jsdom
- **Code Quality**: ESLint + Prettier
- **Transpiler**: Babel

## Project Structure
```
chase-catcher/
├── manifest.json           # Chrome extension manifest (v3)
├── package.json           # Dependencies and scripts
├── babel.config.js        # Babel configuration
├── src/
│   ├── js/
│   │   ├── background.js  # Service worker for background tasks
│   │   ├── content.js     # Content script for Chase.com pages
│   │   └── popup.js       # Popup UI logic
│   └── __tests__/         # Jest test files
├── public/
│   ├── popup.html         # Extension popup interface
│   └── icons/             # Extension icons (16, 48, 128px)
├── config/
│   ├── webpack.config.js  # Webpack build configuration
│   ├── jest.config.js     # Jest test configuration
│   ├── jest.setup.js      # Jest setup file
│   ├── .eslintrc.json     # ESLint rules
│   └── .prettierrc        # Prettier formatting rules
└── dist/                  # Build output (generated)
```

## Key Files
- **manifest.json**: Chrome extension configuration, permissions, content scripts
- **src/js/content.js**: Core automation logic that runs on Chase.com pages
- **src/js/popup.js**: User interface and interaction logic
- **src/js/background.js**: Background service worker for message handling

## Development Workflow
1. **Build**: `npm run build` - Compiles source with webpack
2. **Watch**: `npm run watch` - Auto-rebuild on changes
3. **Test**: `npm test` - Run Jest tests with coverage
4. **Lint**: `npm run lint` - Check code with ESLint
5. **Format**: `npm run format` - Format code with Prettier
6. **Package**: `npm run package` - Create distribution zip

## Chrome Extension Architecture
- **Manifest V3**: Uses modern Chrome extension APIs
- **Host Permissions**: Only for https://secure.chase.com/*
- **Content Scripts**: Injected into Chase.com pages to interact with DOM
- **Service Worker**: Background script for message passing and lifecycle management
- **Popup**: User interface for triggering the automation

## Security & Privacy
- No data collection or external communication
- Works entirely within the browser
- Open source and transparent
- Only interacts with Chase.com domains

## Testing Strategy
- Unit tests for individual functions
- Integration tests for component interactions
- DOM mocking with jsdom
- CI/CD with GitHub Actions

## Code Style
- ESLint configuration enforces consistent code style
- Prettier for automatic formatting
- Single quotes preferred (except when double quotes are enclosed in single quotes)

## Important Notes
- Extension only works on Chase.com offer pages
- Requires minimum Chrome version 88
- Uses smart timing algorithms to avoid detection
- Progress tracking provides real-time feedback

## Recent Changes
- Fixed CI size and preview steps
- Updated ESLint configuration for nested quotes
- Fixed selector changes on Chase offer pages
- Version 1.1.0 released
