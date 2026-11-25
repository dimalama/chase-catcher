# Publishing to Firefox: first-time guide

This walks you through publishing Chase Catcher on **addons.mozilla.org** (AMO), Mozilla's official
add-on store, from creating an account to seeing the extension live. No prior experience needed.

One listing covers **Firefox on Windows, Mac, Linux, and Android**.

| | |
|---|---|
| Cost | Free |
| Computer | Any (Windows, Mac, or Linux) |
| Your time | About 1 hour the first time |
| Waiting time | Automated check: minutes. Human review: usually 1 to 10 days |
| You'll need | An email address, a phone with an authenticator app, the files from Part 2 |

> Screens on Mozilla's site change from time to time. If a button is named slightly differently,
> look for the closest match. Mozilla's own guide is at
> <https://extensionworkshop.com/documentation/publish/submitting-an-add-on/>.

---

## Part 1: Create your Mozilla developer account (about 15 minutes)

### 1.1 Install an authenticator app on your phone
Mozilla **requires two-factor authentication (2FA)** for developers. Without it you cannot sign in to
the developer pages at all.

Install any authenticator app, for example **Google Authenticator**, **Microsoft Authenticator**, or
**1Password**. You'll scan a QR code with it in step 1.3.

### 1.2 Create a Mozilla account
1. Go to <https://addons.mozilla.org/developers/>.
2. Click **Register or Log in** (top right).
3. Enter your email address and click **Sign up** (or **Continue**).
4. Choose a password and enter your age, then confirm.
5. Mozilla emails you a **6-digit code**. Type it in to verify your email.

### 1.3 Turn on two-step authentication
Mozilla usually prompts you for this the first time you open the Developer Hub. If it doesn't:

1. Go to <https://accounts.firefox.com/settings>.
2. Find **Two-step authentication** and click **Add** (or **Enable**).
3. Scan the QR code with your authenticator app, then type the 6-digit code it shows.
4. Mozilla shows **recovery codes**. **Save them now** (password manager, or print them). If you lose
   your phone and these codes, you lose access to the account and to your published add-on.

### 1.4 Accept the developer agreement and set your profile
1. Go back to <https://addons.mozilla.org/developers/> and sign in (you'll be asked for the 2FA code).
2. When asked, read and accept the **Firefox Add-on Distribution Agreement** and review policies.
3. Set a **Display Name** in your profile. This is the "by ..." name shown on your add-on's page.
   You can use a nickname; it does not have to be your legal name.

Your account is ready.

---

## Part 2: Get the files you will upload (about 10 minutes)

You need two zip files:

| File | What it is |
|---|---|
| `chase-catcher-firefox.zip` | The extension itself |
| `chase-catcher-source.zip` | The original source code. Mozilla requires it because the extension is built with tools (webpack, Babel) |

### Option A: download them from GitHub (no setup)
1. Open the repository on GitHub → **Actions** tab.
2. Click the most recent green run of **CI/CD Pipeline** on `main`.
3. Scroll to **Artifacts** and download **chase-catcher-extension**.
4. Unzip it. Inside are `chase-catcher-firefox.zip` and `chase-catcher-source.zip`.
   **Do not unzip those two**; upload them as they are.

### Option B: build them on your computer
1. Install **Node.js 24 LTS** from <https://nodejs.org> (or 22.18+).
2. In a terminal:
   ```bash
   git clone https://github.com/dimalama/chase-catcher.git
   cd chase-catcher
   npm ci
   npm run package          # creates chase-catcher-firefox.zip (and Chrome/Safari)
   npm run package:source   # creates chase-catcher-source.zip
   ```

### Before uploading, check the version
Every upload must have a **higher version** than the last one Mozilla accepted. The version is in
`manifest.json` (`"version": "2.0.0"`). For the very first upload any version works.

---

## Part 3: Test it in your own Firefox first (10 minutes, strongly recommended)

1. Unzip a **copy** of `chase-catcher-firefox.zip` into a folder.
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and choose `manifest.json` in that folder.
4. Log in to Chase, open the **Chase Offers** page, click the extension icon, accept the disclaimer,
   and click **Start Catching**.
5. If Firefox asks to allow access to `secure.chase.com`, allow it.

While it runs, **record your screen** (macOS: Cmd+Shift+5; Windows: Win+Alt+R). A 30 to 60 second video
of the popup activating offers helps reviewers a lot, because they don't have a Chase account. Upload it
to YouTube as **Unlisted** or to Google Drive with link sharing, and keep the link.

The temporary add-on disappears when Firefox restarts. That's expected.

---

## Part 4: Submit the add-on (about 30 minutes)

### 4.1 Start the submission
1. Go to <https://addons.mozilla.org/developers/addons> → **Submit a New Add-on**.
2. **How to distribute this version**: choose **On this site**.
   - "On this site" = public listing that anyone can find, with automatic updates. Choose this.
   - "On your own" = Mozilla signs the file but doesn't list it; you'd share the file yourself.
     Use it only if you want a private test with friends first.
3. Click **Continue**.

### 4.2 Upload the extension
1. Click **Select a file…** and choose `chase-catcher-firefox.zip`.
2. Under **Compatible platforms**, tick both **Firefox** and **Firefox for Android**.
3. Wait for the automatic validation.
   - **Warnings** (yellow) are fine.
   - **Errors** (red) block the upload. See *Troubleshooting* below.
4. Click **Continue**.

### 4.3 Upload the source code
1. Mozilla asks **"Do you need to submit source code?"** Choose **Yes**.
2. Upload `chase-catcher-source.zip`.
3. Click **Continue**.

### 4.4 Describe the add-on
Fill in the form. Suggested values (edit to taste):

| Field | Suggested value |
|---|---|
| **Name** | Your chosen name. Avoid starting with "Chase" (trademark risk); e.g. *Offer Catcher for Chase*. Must match `name` in `manifest.json`, so change it there first if you rename |
| **Add-on URL** | e.g. `offer-catcher-for-chase` (permanent, pick carefully) |
| **Summary** (max 250 chars) | Activates all your Chase credit card offers with one click. Runs only on your own Chase offers page and collects no data. Not affiliated with Chase. |
| **Description** | What it does, how to use it (open offers page → click icon → Start), the disclaimer summary, and a link to the full disclaimer. See the template below |
| **Categories** | Firefox: **Shopping**. Firefox for Android: **Shopping** |
| **Support email** | An address you're happy to make public |
| **Support website** | `https://github.com/dimalama/chase-catcher/issues` |
| **License** | **MIT License** |
| **Privacy policy** | Tick "This add-on has a privacy policy" and paste the text of [`PRIVACY.md`](../PRIVACY.md) |
| **Notes to Reviewer** | Paste the block below and add your demo video link |

**Description template**

```text
Chase Catcher activates every available offer on your Chase credit card offers page with one click,
so you never miss cash back.

How to use:
1. Log in to Chase and open your card's Offers page.
2. Click the Chase Catcher icon and accept the disclaimer (first time only).
3. Click Start Catching. You can stop at any time.

Privacy: runs only on secure.chase.com, makes no network requests, collects no data.

Disclaimer: Chase Catcher is an independent open-source project, not affiliated with or endorsed by
JPMorgan Chase & Co. It automates clicks in your own account; use it at your own risk.
Full disclaimer: https://github.com/dimalama/chase-catcher/blob/main/DISCLAIMER.md
Source code: https://github.com/dimalama/chase-catcher
```

**Notes to Reviewer** (paste, then fill in the video link)

```text
Build instructions (the output is byte-identical to the uploaded package):

Requirements: Node.js 22.18+ or 24.11+, npm 10+. Any OS.
1. Unzip the source archive and open a terminal in that folder
2. npm ci
3. npm run build
4. The Firefox extension is in build/firefox/

Webpack runs with minimize: false, so dist/*.js is readable as shipped.
The only third-party runtime code is webextension-polyfill (from npm).

What it does: only on https://secure.chase.com, after the user clicks Start in the popup,
it clicks the "add offer" tiles on the user's own Chase offers page.
No network requests, no remote code, no data collection (data_collection_permissions: none).
Local storage holds an activation counter and the user's disclaimer acceptance.

Testing requires a Chase credit card account. Demo video: <PASTE LINK>
Automated tests: npm test.
```

### 4.5 Submit
Click **Submit Version**. You'll see a confirmation page. Mozilla emails you when the review is done.

### 4.6 Add images (while you wait)
1. Developer Hub → **My Add-ons** → your add-on → **Edit Product Page**.
2. **Icon**: upload `public/icons/icon128.png`.
3. **Screenshots**: 1280 × 800 PNG or JPG works well. Take them of the popup on the Chase offers page,
   and **blur your merchant offers, card number, and name** before uploading.

---

## Part 5: After you submit

- **Status** shows on the add-on's page in the Developer Hub: *Awaiting Review* → *Approved* (public)
  or a message from the reviewer.
- **If the reviewer asks something**, you get an email. Reply from the add-on's **Review History**
  section in the Developer Hub, not by email.
- **Once approved**, your add-on is live at `https://addons.mozilla.org/firefox/addon/<your-add-on-url>/`.
  Firefox users who install it get updates automatically.

## Publishing an update later
1. Raise `version` in `manifest.json` and `package.json` (e.g. `2.0.0` → `2.1.0`), commit, push.
2. Get fresh zips (Part 2).
3. Developer Hub → your add-on → **Upload New Version**.
4. Upload `chase-catcher-firefox.zip`, answer **Yes** to source code, upload `chase-catcher-source.zip`.
5. Add release notes ("What's new") and re-paste the reviewer notes. Submit.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Can't sign in to the Developer Hub | Two-step authentication isn't on yet: step 1.3 |
| "Version already exists" / "must be higher" | Raise `version` in `manifest.json` and rebuild |
| Validator error about `manifest.json` not found | You uploaded a folder or a zip *of the zip*. Upload `chase-catcher-firefox.zip` itself |
| Validator error about `data_collection_permissions` | AMO's validator was briefly behind Firefox. Retry later or ask in the Mozilla Discourse "Add-ons" forum |
| Rejected: "source code doesn't match" | Make sure the source zip and extension zip come from the **same** commit (Part 2 Option A guarantees this) |
| Rejected over the name or Chase trademark | Rename (e.g. *Offer Catcher for Chase*) in `manifest.json`, bump the version, resubmit |
| Reviewer says they can't test | Point them to the demo video; offer to answer questions in Review History |

Help: Mozilla's add-on developer forum at <https://discourse.mozilla.org/c/add-ons/35>.
