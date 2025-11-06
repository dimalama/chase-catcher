---
description: Create a distribution package of the extension
---

Create a production-ready package of the ChaseCatcher extension that can be uploaded to the Chrome Web Store.

This command will:
1. Clean existing build artifacts (dist/, coverage/, package/)
2. Build the extension with webpack
3. Create a package directory with the necessary files
4. Copy manifest.json and public/ directory
5. Copy compiled JavaScript files to package/src/js/
6. Create a chase-catcher.zip file ready for distribution

Run `npm run package` to execute this workflow.
