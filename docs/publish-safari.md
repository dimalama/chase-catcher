# Publishing to Safari (iPhone, iPad, Mac): first-time guide

This walks you through publishing Chase Catcher on the **Apple App Store**, from creating a developer
account to seeing the extension live. No prior experience needed.

Safari extensions are sold inside a small "container" app. The App Store page is for that app, and the
extension comes with it. One App Store listing can cover **iPhone, iPad, and Mac**.

| | |
|---|---|
| Cost | **$99 per year** (Apple Developer Program). Publishing a free app costs nothing extra |
| Computer | **No Mac required** with Apple's web packager (Path A). A Mac with Xcode is optional (Path B) |
| Your time | 2 to 3 hours the first time |
| Waiting time | Enrollment: minutes to 2 days. App review: usually 1 to 3 days |
| You'll need | An Apple Account with two-factor authentication, a payment card, an iPhone for testing |

> Apple renames and moves screens fairly often. If a button looks different, search Apple's help at
> <https://developer.apple.com/help/app-store-connect/>. Apple's guide for this exact workflow:
> [Packaging and distributing Safari Web Extensions with App Store Connect](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect).

---

## Part 0: Decide two things before paying

### Individual or company?
- **Individual** (simplest): your **legal name** appears on the App Store as the seller, e.g.
  "Dima Lukianenko". No paperwork beyond ID and a card.
- **Organization** (LLC etc.): the company name appears instead. Requires a registered company and a
  free **D-U-N-S number**, which can take up to 2 weeks to get.

For a free side project, Individual is fine.

### The name
Apple is the strictest store about trademarks (App Review Guideline 5.2). A name **starting with
"Chase"** has a real chance of rejection. A name like **"Offer Catcher for Chase"** is much safer.
Decide before you start, because the app name is set in several places.

---

## Part 1: Create your Apple developer account (30 minutes to 2 days)

### 1.1 Make sure your Apple Account has two-factor authentication
You probably already use an Apple Account (formerly Apple ID) on your iPhone. Two-factor authentication
must be on:

- iPhone: **Settings → [your name] → Sign-In & Security → Two-Factor Authentication** should say **On**.

You can use your personal Apple Account, or create a separate one for development at
<https://account.apple.com>. A separate account keeps personal and developer things apart, but you then
sign in to TestFlight on your iPhone with it, which is less convenient. Using your personal one is fine.

### 1.2 Enroll in the Apple Developer Program
The fastest way is the **Apple Developer** app on your iPhone (identity check by scanning your ID,
approval often within minutes):

1. Install **Apple Developer** from the App Store and open it.
2. Tap **Account** → sign in → **Enroll Now**.
3. Choose **Individual**.
4. Enter your **legal name** exactly as on your ID, address, and phone number.
5. Follow the prompts to verify your identity (photo of your driver's license or passport).
6. Read and accept the **Apple Developer Program License Agreement**.
7. Pay **$99** (it renews yearly; you can turn off auto-renew later, but your app is removed from the
   store if the membership lapses).

Alternatively, enroll on the web at <https://developer.apple.com/programs/enroll/>. It can take up to
2 business days to verify.

You'll get a "Welcome to the Apple Developer Program" email when it's active.

### 1.3 Finish setup in App Store Connect
1. Sign in at <https://appstoreconnect.apple.com> with the same Apple Account.
2. Open **Business** (or **Agreements, Tax, and Banking**). Accept any pending agreement.
   For a **free** app you do **not** need to fill in bank or tax forms.
3. **EU Digital Services Act**: Apple asks **every** developer to declare a **trader status**, even if
   you won't sell in the EU. You'll find it in **Business** (or on your app's **App Information** page).
   - If you're a **trader**, your address, phone, and email are shown publicly on the App Store in the EU.
   - Many hobby developers of free apps declare **not a trader**, but Apple says to get legal advice if
     unsure. If you limit the app to the **United States only** (Part 5), the EU question matters less,
     but you still have to answer it.

---

## Part 2: Register the app's ID and create the app (15 minutes)

### 2.1 Register a bundle ID
A bundle ID is the app's permanent unique name in reverse-domain style.

1. Go to <https://developer.apple.com/account/resources/identifiers/list>.
2. Click the **+** button → **App IDs** → **Continue** → **App** → **Continue**.
3. **Description**: `Chase Catcher`. **Bundle ID**: choose **Explicit** and enter
   `com.dimalama.chasecatcher`.
4. Leave capabilities as they are. **Continue** → **Register**.

(If the packager in Part 3 asks for its own bundle ID or creates one automatically, that's fine too.
Use the same ID everywhere.)

### 2.2 Create the app record
1. In App Store Connect, go to **Apps** → **+** (top left) → **New App**.
2. **Platforms**: tick **iOS** and **macOS**. (iOS also covers iPad and Vision Pro.)
   If you don't own a Mac, you can tick only **iOS** now and add macOS later.
3. **Name**: your chosen name (max 30 characters, must be unique on the App Store).
4. **Primary Language**: English (U.S.).
5. **Bundle ID**: pick `com.dimalama.chasecatcher` from the list.
6. **SKU**: any private code, e.g. `chasecatcher001`.
7. **User Access**: Full Access.
8. Click **Create**.

---

## Part 3: Upload the extension

You need `chase-catcher-safari.zip`. Get it from GitHub without any setup:

1. Repository on GitHub → **Actions** → latest green **CI/CD Pipeline** run on `main`.
2. Download the **chase-catcher-extension** artifact and unzip it once. Inside is
   `chase-catcher-safari.zip`.

   If **Artifacts** is empty or says *expired* (downloads are kept for 30 days), open that run, click
   **Re-run all jobs**, wait about 2 minutes, and refresh the page.

(Or build it yourself: install Node.js 24 LTS, then `npm ci && npm run package` in the repository.)

Every upload needs a **higher version** than the previous one: raise `version` in `manifest.json` and
`package.json` before building an update.

### Path A: Apple's web packager (no Mac needed, recommended)
1. In App Store Connect, open **Users and Access** (in the top menu or under **…**).
2. Open the **Xcode Cloud** tab, then **Safari Web Extension Packager**.
3. Click **Upload** and choose `chase-catcher-safari.zip`.
   If it asks for files instead of a zip, unzip it and select everything inside (the folder that
   contains `manifest.json`, `dist`, and `public`).
4. Choose the app you created in Part 2 and its platforms when asked.
5. Wait for **packaging** to finish; the status shows in the same tab (usually minutes).
   It uses some of the 25 free Xcode Cloud hours included in your membership.
6. Read any **compatibility warnings**. Expected and harmless: keyboard shortcuts don't exist on
   iPhone/iPad. Anything else, see *Troubleshooting*.

If you can't find the packager screen, Apple may have moved it: search "Safari Web Extension Packager"
in App Store Connect help, or use Path B.

### Path B: Xcode on a Mac (optional)
1. Install **Xcode** from the Mac App Store and sign in: **Xcode → Settings → Accounts → +**.
2. In the repository: `npm ci && npm run build && npm run safari:xcode`.
3. Open the generated project in `safari-xcode/`.
4. For **each** of the four targets (iOS app, iOS extension, macOS app, macOS extension):
   **Signing & Capabilities** → **Team**: your name. Check bundle IDs: apps
   `com.dimalama.chasecatcher`, extensions `com.dimalama.chasecatcher.Extension`.
5. At the top, choose **Any iOS Device (arm64)** → **Product → Archive**.
6. In the Organizer window: **Distribute App → App Store Connect → Upload**.
7. Repeat with **Any Mac** for the macOS app.

---

## Part 4: Test on your iPhone with TestFlight (20 minutes, do not skip)

1. App Store Connect → your app → **TestFlight** tab. Your build appears there once processed.
   If it asks about **encryption**, answer **None of the algorithms mentioned above** (the extension
   uses no encryption of its own).
2. **Internal Testing** → **+** → create a group → add yourself.
3. On your iPhone, install **TestFlight** from the App Store and open the invite (email or in-app).
   Tap **Install**.
4. Turn on the extension: **Settings → Apps → Safari → Extensions → Chase Catcher** → **On**.
   Under permissions set **secure.chase.com** to **Allow**.
5. In Safari, log in to Chase and open the **Offers** page. Tap the **AA** (or puzzle) icon in the
   address bar → **Chase Catcher** → accept the disclaimer → **Start Catching**.
6. **Record the screen** while it works (Control Center → Screen Recording). Upload the video to
   YouTube as **Unlisted** or to iCloud/Google Drive with a share link. You'll give this to Apple's
   reviewers, who can't log in to Chase.
7. Take **screenshots** at the same time for the store listing (Part 5). Blur your offers, card
   details, and name afterwards.

Mac: install **TestFlight** from the Mac App Store, install the build, then **Safari → Settings →
Extensions** → enable it.

---

## Part 5: Fill in the App Store page (45 minutes)

In App Store Connect → your app. The iOS and macOS versions each have their own page in the left
sidebar; fill in both if you're shipping both.

### App Information (left sidebar)
| Field | Suggested value |
|---|---|
| Subtitle (30 chars) | Activate card offers in 1 tap |
| Category | **Productivity** (primary). Secondary: Utilities |
| Content Rights | No third-party content |
| Age Rating | Click **Edit**, answer **None/No** to everything. Result should be **4+** |

### Pricing and Availability
- **Price**: Free.
- **Availability**: consider **United States only**, since Chase cards are US-only. This also avoids
  most country-specific questions.

### App Privacy
1. **Privacy Policy URL**: `https://github.com/dimalama/chase-catcher/blob/main/PRIVACY.md`
2. **Data collection**: click **Get Started** → "Do you or your third-party partners collect data from
   this app?" → **No** → **Publish**. The page will show **Data Not Collected**.

### Version page (iOS App → 1.0, and macOS App → 1.0)
| Field | What to enter |
|---|---|
| **Screenshots** | iPhone: from an iPhone with a 6.9" or 6.5" screen (Pro Max/Plus models), 1 to 10 images. iPad 13": needed because the app runs on iPad; take them on an iPad, or ask in TestFlight beta for someone with one. Mac: 16:10, e.g. 2880 × 1800. Check current sizes: [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) |
| **Promotional text** | Optional |
| **Description** | Same as the Firefox description template in [publish-firefox.md](publish-firefox.md#44-describe-the-add-on), replacing "Click the icon" with "Tap AA in Safari" |
| **Keywords** (100 chars, comma-separated) | `cash back,card offers,rewards,safari extension,deals,coupons,credit card` |
| **Support URL** | `https://github.com/dimalama/chase-catcher/issues` |
| **Copyright** | `2026 Dima Lukianenko` |
| **Build** | Click **+** and select the build you tested in TestFlight |

### App Review Information (bottom of the version page)
- **Sign-in required**: **untick** it (there's no account in the app itself).
- **Contact**: your name, phone, email (only Apple sees these).
- **Notes**: paste this and add your video link:

```text
This is a Safari web extension. It only works on the user's own Chase credit card offers page
(secure.chase.com), which requires a personal Chase bank login, so we cannot provide credentials.

Demo video of the full flow on iPhone: <PASTE LINK>

To check it without a Chase account: enable the extension in Settings > Apps > Safari > Extensions,
open any website in Safari, tap AA > Chase Catcher. The popup shows the disclaimer and then
explains that the Chase offers page must be open.

The extension makes no network requests and collects no data. It is open source:
https://github.com/dimalama/chase-catcher
```

---

## Part 6: Submit for review

1. At the top right of the version page, click **Add for Review**.
2. Choose a release option:
   - **Manually release this version** (recommended the first time: you press the button when ready),
   - **Automatically release** after approval.
3. Click **Submit for Review**. Status: *Waiting for Review* → *In Review* → *Ready for Distribution*.
4. If Apple has questions or rejects, you'll get an email. Read and reply in App Store Connect under
   **App Review** (the message center). You can fix and resubmit as many times as needed.

Once released, the app is on the App Store, and the extension is available to anyone who installs it.

---

## Publishing an update later
1. Raise `version` in `manifest.json` and `package.json` (e.g. `2.0.0` → `2.1.0`), commit, push.
2. Get the new `chase-catcher-safari.zip` and upload it (Part 3).
3. Test in TestFlight (Part 4).
4. App Store Connect → your app → **+** next to the platform → new version number (e.g. 2.1.0).
5. Enter **What's New in This Version**, select the new build, and **Add for Review**.

Store text and screenshots carry over from the previous version.

---

## Troubleshooting and common rejections

| Problem | What to do |
|---|---|
| Can't sign in or enroll | Turn on two-factor authentication for your Apple Account (Part 1.1). Legal name must match your ID exactly |
| Enrollment stuck "pending" | Wait 2 business days, then contact Apple at <https://developer.apple.com/contact/> |
| Bundle ID not in the New App list | Register it first (Part 2.1); it can take a few minutes to appear |
| Upload rejected: version already used | Raise `version` in `manifest.json`, rebuild, upload again |
| App blocked in the EU: "Trader status not provided" | Complete the trader declaration (Part 1.3). Or limit availability to the US |
| **Guideline 2.1, information needed / couldn't review** | Reply with the demo video link and explain a Chase account is required |
| **Guideline 5.2, intellectual property** (Chase name) | Rename the app (e.g. "Offer Catcher for Chase"), keep "not affiliated" in the description, resubmit |
| **Guideline 4.2, minimum functionality** | Reply that it's a Safari extension whose value is in Safari, and point to the video. Safari extension container apps are a normal App Store category |
| **Guideline 2.3, metadata** (screenshots) | Screenshots must show the app/extension in use. Retake them on the Chase page with personal details blurred |

Apple's general help: <https://developer.apple.com/support/>.
