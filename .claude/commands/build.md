---
description: Build the extension with webpack
---

Build the ChaseCatcher Chrome extension using webpack. This will:
1. Clean any existing build artifacts if needed
2. Run `npm run build` to compile the source code
3. Check the dist/ directory for output files
4. Verify that all entry points (background.js, content.js, popup.js) are compiled correctly
5. Report any build errors or warnings

The build process uses webpack with babel-loader to transpile modern JavaScript for browser compatibility.
