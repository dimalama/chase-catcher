# Publishing Chase Catcher

How to ship Chase Catcher to the Firefox Add-ons store (AMO) and the Apple App Store (Safari on Mac,
iPhone, and iPad). A short Chrome Web Store section is at the end.

| Store | Cost | Needs a Mac? | Typical review | What you upload |
|---|---|---|---|---|
| Firefox Add-ons (AMO) | Free | No | Automated check in minutes; human review can take days | `chase-catcher-firefox.zip` + `chase-catcher-source.zip` |
| Apple App Store | $99/year (Apple Developer Program) | **No** with Apple's web packager; yes for the Xcode route | Usually 1 to 3 days | `chase-catcher-safari.zip` (web packager) or an Xcode archive |
| Chrome Web Store | $5 one-time | No | Hours to a few days | `chase-catcher-chrome.zip` |

> Store rules change often. The steps below match the stores' documentation as of November 2026.
> If a screen looks different, the linked official page is the source of truth.

---

## Before any submission

### 1. Decide on the name (read this first)

All three stores reject or take down listings that use another company's trademark in a way that
suggests affiliation. A name that **starts** with "Chase" is the most likely thing to get the app
rejected, especially by Apple (App Review Guideline 5.2.1, intellectual property).

Names that describe compatibility are usually accepted much more easily. For example:

- "Offer Catcher for Chase"
- "Card Offer Catcher (for Chase)"

If you rename, change `name` and `short_name` in `manifest.json`. Keep the "not affiliated with
Chase" line in every store description either way.

### 2. Bump the version

Every store rejects an upload whose version is not higher than the last one. Update `version` in
both `manifest.json` and `package.json` (for example `2.0.0` → `2.1.0`).

### 3. Build the packages

Commit your changes first, because the source archive is built from the last commit.

```bash
npm ci
npm test
npm run package          # chase-catcher-chrome.zip, chase-catcher-firefox.zip, chase-catcher-safari.zip
npm run package:source   # chase-catcher-source.zip (for Mozilla reviewers)
```

Each zip has `manifest.json` at its root, which is what every store expects.

### 4. Prepare shared listing material

- **Short description** (under 130 characters): "Activates all your Chase card offers with one click. Runs locally; collects no data. Not affiliated with Chase."
- **Full description**: what it does, how to use it, the disclaimer summary, and a link to [DISCLAIMER.md](DISCLAIMER.md).
- **Privacy policy URL**: `https://github.com/dimalama/chase-catcher/blob/main/PRIVACY.md`
- **Support URL**: `https://github.com/dimalama/chase-catcher/issues`
- **Screenshots**: blur or replace your real merchant offers and card details before using them.
- **Demo video** (strongly recommended): reviewers do not have a Chase account, so a 30 to 60 second screen recording of the popup activating offers saves a rejection round. Upload it as an unlisted video and paste the link in the reviewer notes.

---

## Firefox Add-ons (AMO)

Covers Firefox desktop and Firefox for Android from one listing.

### One-time setup
1. Create a Mozilla account and sign in at <https://addons.mozilla.org/developers/>.
2. Accept the developer agreement when prompted.

### Submit the first version
1. Go to **Submit a New Add-on**.
2. Choose where it will be distributed:
   - **On this site** (listed): public on addons.mozilla.org, searchable, auto-updates for users. Choose this for a public release.
   - **On your own** (unlisted): Mozilla signs it but does not list it. You share the `.xpi` yourself. Good for a private beta.
3. Upload `chase-catcher-firefox.zip`. Tick both **Firefox** and **Firefox for Android** as compatible platforms.
4. The automatic validator runs. Warnings are fine; errors must be fixed. `npm run lint:firefox` runs the same checks locally.
5. When asked **"Do you need to submit source code?"**, answer **Yes**. The extension is built with webpack and Babel, so Mozilla requires the original source and exact build steps. Upload `chase-catcher-source.zip`.
6. Fill in the listing: name, summary, description, category (**Shopping**), support site and email, license (**MIT**), and the privacy policy.
7. In **Notes to Reviewer**, paste the text below.
8. Submit. The version goes to review.

#### Notes to reviewer (paste as-is, then update the version)

```text
Build instructions (output is byte-identical to the uploaded package):

Requirements: Node.js 22.18+ or 24.11+, npm 10+. Any OS (tested on Linux).
1. Unzip the source archive and cd into it
2. npm ci
3. npm run build
4. The Firefox extension is in build/firefox/ (manifest.json, dist/, public/)

Webpack is configured with minimize: false, so dist/*.js is readable as shipped.
Third-party runtime code: webextension-polyfill only (from npm).

What it does: on https://secure.chase.com only, when the user clicks Start in the
popup, it clicks the "add offer" tiles on the user's own Merchant Offers page.
No network requests, no remote code, no data collection
(data_collection_permissions: none). Storage holds a local counter and the
user's disclaimer acceptance.

Testing needs a Chase card account. Demo video: <link>
Automated tests: npm test (Jest, 87 tests).
```

### Data collection declaration
New Firefox add-ons must declare whether they collect data. This is already set in `manifest.json`
(`browser_specific_settings.gecko.data_collection_permissions: { "required": ["none"] }`). Firefox 127
and older refuse that key, which is why the minimum version is 128.

### Updates
1. Bump the version, commit, run `npm run package && npm run package:source`.
2. On your add-on's page in the Developer Hub, choose **Upload New Version**, upload both zips, and update the reviewer notes.

Optional, from the command line instead of the website (needs API keys from **Developer Hub → Tools → Manage API Keys**):

```bash
npx web-ext sign --source-dir build/firefox --channel listed \
  --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET" \
  --upload-source-code chase-catcher-source.zip
```

Never commit the API keys.

---

## Apple App Store (Safari on Mac, iPhone, iPad)

Safari extensions ship inside an app. Apple now offers two ways to build that app:

| | Route A: Web packager | Route B: Xcode |
|---|---|---|
| Needs a Mac | No, any browser | Yes, with Xcode |
| Input | `chase-catcher-safari.zip` | `npm run safari:xcode` project |
| Customise the container app | No | Yes |
| Recommended for | First release, simple updates | Custom app UI, local debugging |

Both routes produce iOS (also runs on iPadOS and visionOS) and macOS apps.

### One-time setup
1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/enroll/) ($99/year). If you enroll as an individual, your **legal name is shown as the seller** on the App Store. Enrolling as an LLC shows the company name instead (requires a D-U-N-S number).
2. Sign in to [App Store Connect](https://appstoreconnect.apple.com).

### Create the app record
1. **Apps → (+) → New App**.
2. Platforms: tick **iOS** and **macOS**.
3. Name (see the naming note above), primary language, and bundle ID `com.dimalama.chasecatcher`. Use the same bundle ID for every future update.
4. SKU: anything internal, e.g. `chasecatcher`.
5. Click **Create**.

### Route A: upload with the Safari Web Extension Packager (no Mac)
1. In App Store Connect, open **Users and Access** (under the **…** menu if hidden) → **Xcode Cloud** tab → **Safari Web Extension Packager**. Apple has moved this screen before; if it is not there, search App Store Connect help for "Safari Web Extension Packager".
2. Click **Upload** and select `chase-catcher-safari.zip` (or its contents, if asked for files).
3. Wait for packaging to finish. Its status shows in the same tab. Packaging uses your monthly Xcode Cloud hours (25 included).
4. Read any **compatibility exceptions**. Expected and harmless: keyboard shortcuts (`commands`) do nothing on iPhone/iPad. Notifications were already removed from the Safari build.
5. Continue with **TestFlight** below.

Apple's guide: [Packaging and distributing Safari Web Extensions with App Store Connect](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect).

### Route B: build and upload with Xcode (Mac)
1. `npm run build && npm run safari:xcode` creates `safari-xcode/` with iOS and macOS targets.
2. Open the project in Xcode. For **every** target (both apps and both extensions), set your Team under **Signing & Capabilities** and check the bundle IDs: apps `com.dimalama.chasecatcher`, extensions `com.dimalama.chasecatcher.Extension`.
3. Choose **Any iOS Device** → **Product → Archive** → **Distribute App** → **App Store Connect** → **Upload**.
4. Repeat with **Any Mac** for the macOS app.

### TestFlight (do not skip)
1. In App Store Connect → your app → **TestFlight**, add yourself as an internal tester.
2. Install the **TestFlight** app on your iPhone and Mac and install the build.
3. iPhone: **Settings → Apps → Safari → Extensions → Chase Catcher** → turn on, and set `secure.chase.com` to **Allow**. Mac: **Safari → Settings → Extensions** → enable it.
4. Run it on your real Chase offers page and record the demo video at the same time.

### Fill in the App Store listing
On the app's version page:

- **Screenshots** (PNG/JPEG, no transparency, 1 to 10 each). Check sizes on Apple's [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) page. As of late 2026 that means at least:
  - iPhone 6.9" display, e.g. 1320 × 2868
  - iPad 13" display, e.g. 2064 × 2752 (because the iOS app runs on iPad)
  - Mac, 16:10, e.g. 2880 × 1800
- **Description, keywords, support URL, privacy policy URL** (see "Before any submission").
- **Category**: Productivity (primary).
- **App Privacy**: answer **Data Not Collected**.
- **Age rating**: complete the questionnaire (all "None"). It should come out as the lowest rating.
- **Pricing and Availability**: Free. Consider limiting to the **United States**, since Chase cards are US-only.
- **App Review Information**: there is no demo account to give (it would be your real bank login), so use the notes:

```text
This is a Safari web extension that works only on the user's own Chase credit card
offers page (secure.chase.com) and requires a Chase account, so we cannot provide
login credentials. Demo video of the full flow: <link>

To check it without an account: enable the extension in Settings > Apps > Safari >
Extensions, open Safari, tap the extension in the AA menu. The popup shows the
disclaimer, then the Start button. On non-Chase pages it explains that the Chase
offers page must be open.

The extension makes no network requests and collects no data.
Source code: https://github.com/dimalama/chase-catcher
```

### Submit
1. Under **Build**, select the uploaded build (one for iOS, one for macOS).
2. Choose a release option: manual, automatic after approval, or phased.
3. **Add for Review → Submit**. Status goes to *In Review*, then *Ready for Distribution* once approved.

### Updates
Bump the version, rebuild, upload a new build with the packager or Xcode, add a new version in App
Store Connect, select the build, and submit again. Listing text and screenshots carry over.

### Mac only, outside the App Store (optional)
You can also distribute the Mac app yourself as a download: sign it with a **Developer ID** certificate
and notarize it with Apple (Xcode: **Distribute App → Direct Distribution**). Users then install it like
any Mac app and enable the extension in Safari settings. iPhone and iPad apps can only be distributed
through the App Store (or TestFlight).

---

## Chrome Web Store (for completeness)

1. Register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time).
2. **New item** → upload `chase-catcher-chrome.zip`.
3. Fill in **Store listing**, **Privacy** (single purpose: "Activate Chase card offers on the user's own offers page"; justify each permission; certify no data collection), and **Distribution**.
4. Submit for review. Updates: bump the version and upload a new zip on the same item.

The same listing also works for Edge, Brave, and Opera users. Edge has its own optional store:
[Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/) (free).

---

## Checklist per release

- [ ] Version bumped in `manifest.json` and `package.json`, committed
- [ ] `npm test` passes
- [ ] `npm run package && npm run package:source`
- [ ] Tested each build on the real Chase offers page
- [ ] Firefox: upload extension zip + source zip, update reviewer notes
- [ ] Apple: upload via packager or Xcode, test in TestFlight, submit
- [ ] Chrome: upload zip
- [ ] If the disclaimer text changed: `DISCLAIMER_VERSION` bumped in `src/utils/disclaimer.ts`
