# ChaseCatcher Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Google Chrome

### Initial Setup
1. Clone the repository:
```bash
git clone https://github.com/dimalama/chase-catcher.git
cd chase-catcher
```

2. Install dependencies:
```bash
npm install
```

3. Start development mode:
```bash
npm run dev
```

## 🛠️ Development Workflow

### Directory Structure
```
chase-catcher/
├── __tests__/           # Test files
├── .github/             # GitHub configuration
├── scripts/             # Build and utility scripts
├── store_assets/        # Chrome Web Store assets
├── src/                 # Source code
│   ├── content.js       # Content script
│   ├── popup.js        # Popup script
│   └── background.js   # Background script
└── dist/               # Build output
```

### Available Scripts
- `npm run dev`: Start development mode with hot reload
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run lint`: Check code style
- `npm run format`: Format code with Prettier

### Testing
We use Jest for testing. Tests are located in the `__tests__` directory.

#### Running Tests
- Run all tests: `npm test`
- Run specific test: `npm test -- content.test.js`
- Watch mode: `npm test -- --watch`
- Coverage report: `npm test -- --coverage`

### Code Style
We use ESLint and Prettier to maintain code quality:
- ESLint enforces code quality rules
- Prettier ensures consistent formatting
- Pre-commit hooks automatically format code

### Building for Production
1. Update version in `manifest.json`
2. Run `./scripts/build.sh`
3. Find the packaged extension in `chasecatcher.zip`

## 🔍 Chrome Extension Development

### Loading the Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` directory

### Debugging
- Use Chrome DevTools for debugging
- Content script console: Inspect page elements
- Background script console: Click "background page" in extension details
- Popup console: Right-click popup and select "Inspect"

### Common Issues
1. **Popup Not Loading**
   - Check manifest.json permissions
   - Verify popup.html path
   - Check console for errors

2. **Content Script Not Running**
   - Verify matches pattern in manifest.json
   - Check if URL matches pattern
   - Look for console errors

3. **Build Errors**
   - Clear dist directory
   - Delete node_modules and reinstall
   - Check webpack configuration

## 📦 Release Process

### Pre-release Checklist
- [ ] Update version numbers
- [ ] Run full test suite
- [ ] Check bundle size
- [ ] Test in incognito mode
- [ ] Verify permissions
- [ ] Update documentation

### Creating a Release
1. Create release branch
2. Update version in files
3. Run build script
4. Test package locally
5. Create GitHub release
6. Submit to Chrome Web Store

### Chrome Web Store Submission
1. Prepare store assets
2. Update screenshots
3. Review privacy policy
4. Submit for review
5. Monitor review status

## 🔐 Security Best Practices

### Code Guidelines
- Avoid inline scripts
- Use strict CSP
- Minimize permissions
- Sanitize user input
- Use HTTPS only

### Data Handling
- No sensitive data storage
- Clear data on uninstall
- Use secure communication
- Follow privacy policy

## 🤝 Contributing

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Write tests
4. Update documentation
5. Submit PR

### Code Review Guidelines
- Follow style guide
- Include tests
- Update docs
- Keep changes focused

## 📚 Resources

### Documentation
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Webpack Guide](https://webpack.js.org/guides/)

### Tools
- [Chrome Extensions Manager](chrome://extensions/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
