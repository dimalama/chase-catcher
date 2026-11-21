/**
 * Produces one ready-to-load extension folder per browser from the shared
 * root manifest.json, the compiled dist/ bundle, and public/ assets.
 *
 *   build/chrome   -> Chrome, Edge, Brave, Opera (MV3 service worker)
 *   build/firefox  -> Firefox desktop + Android (MV3 event page)
 *   build/safari   -> input for `xcrun safari-web-extension-converter`
 *                     (macOS Safari + iOS/iPadOS Safari)
 *
 * Usage:
 *   node config/build-targets.js          # write build/<browser>/
 *   node config/build-targets.js --zip    # also write chase-catcher-<browser>.zip
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['chrome', 'firefox', 'safari'];

const clone = obj => JSON.parse(JSON.stringify(obj));

/**
 * Returns the manifest for a given browser. Pure function: exported for tests.
 */
const buildManifest = (base, target) => {
  const manifest = clone(base);
  const backgroundScript = base.background.service_worker;

  switch (target) {
    case 'chrome':
      // Chrome warns on unknown keys; gecko settings are Firefox-only.
      delete manifest.browser_specific_settings;
      break;

    case 'firefox':
      // Firefox MV3 does not run background service workers; it uses an
      // event page declared via background.scripts instead.
      manifest.background = { scripts: [backgroundScript] };
      delete manifest.minimum_chrome_version;
      break;

    case 'safari':
      // Safari requires a non-persistent background (mandatory on iOS) and
      // does not implement the notifications API.
      manifest.background = { scripts: [backgroundScript], persistent: false };
      manifest.permissions = manifest.permissions.filter(p => p !== 'notifications');
      delete manifest.minimum_chrome_version;
      delete manifest.browser_specific_settings;
      break;

    default:
      throw new Error(`Unknown target: ${target}`);
  }

  return manifest;
};

const copyDir = (src, dest) => {
  fs.cpSync(src, dest, { recursive: true });
};

const writeTarget = (base, target) => {
  const outDir = path.join(ROOT, 'build', target);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  copyDir(path.join(ROOT, 'dist'), path.join(outDir, 'dist'));
  copyDir(path.join(ROOT, 'public'), path.join(outDir, 'public'));
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(buildManifest(base, target), null, 2) + '\n'
  );
  return outDir;
};

const zipTarget = (outDir, target) => {
  const zipPath = path.join(ROOT, `chase-catcher-${target}.zip`);
  fs.rmSync(zipPath, { force: true });
  execFileSync('zip', ['-qr', zipPath, '.'], { cwd: outDir });
  return zipPath;
};

const main = () => {
  if (!fs.existsSync(path.join(ROOT, 'dist', 'background.js'))) {
    console.error('dist/ is missing. Run webpack first (npm run build).');
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const zip = process.argv.includes('--zip');

  for (const target of TARGETS) {
    const outDir = writeTarget(base, target);
    const rel = path.relative(ROOT, outDir);
    if (zip) {
      console.log(`${target}: ${rel} -> ${path.relative(ROOT, zipTarget(outDir, target))}`);
    } else {
      console.log(`${target}: ${rel}`);
    }
  }
};

if (require.main === module) {
  main();
}

module.exports = { buildManifest, TARGETS };
