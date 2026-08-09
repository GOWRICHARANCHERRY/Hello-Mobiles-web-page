# Hello Mobiles — Google Play Store Submission Checklist

Everything technical is DONE (TWA built, signed, asset links verified). What remains are
account/business steps only **you** can do.

## Step 1 — Play Console account (user action)
- [ ] Create account at https://play.google.com/console (Google account)
- [ ] Pay **$25** one-time registration fee
- [ ] Complete identity/business verification (business name, address, docs — partnership deed works)
- [ ] Set developer profile: **Hello Mobiles**, email svlnmobiles12@gmail.com, phone +91 97157 36736

## Step 2 — Create the app
- [ ] "Create app" → name **Hello Mobiles** → package name **com.hellomobiles.app** (must match)
- [ ] App category: **Shopping** > Electronics
- [ ] Set app as free (no price)
- [ ] Fill the Data safety form (see Step 4)

## Step 3 — Upload the build
- [ ] "Production" release track → upload **`twa/app-release-bundle.aab`**
  (path: `/Users/apple/Desktop/Hello Mobiles web page/twa/app-release-bundle.aab`)
- [ ] Release notes: "Hello Mobiles app — shop mobile phones, electronics & home appliances with EMI, home delivery and order tracking."
- [ ] Roll out to 100% after review passes

## Step 4 — Store listing (assets already in `play-store/`)
- [ ] Short description (80 chars): "Mobiles, electronics & home appliances with EMI and delivery in Nellore."
- [ ] Full description — use the site's about/terms content
- [ ] Icon → `play-store/feature-graphic.png` is the feature graphic; app icon = `client/public/logo-512.png`
- [ ] Feature graphic → `play-store/feature-graphic.png` (1024×500)
- [ ] Phone screenshots → `play-store/phone-home.png`, `phone-products.png`, `phone-detail.png` (1080×1920)
- [ ] App category: Shopping
- [ ] Contact: website https://hello-mobiles.com, privacy policy https://hello-mobiles.com/privacy-policy, email svlnmobiles12@gmail.com
- [ ] Data safety form: app collects/processes personal data via account (name/phone/address), payments via Razorpay/PhonePe, location only when delivery boy shares it — answer honestly per Play's form
- [ ] Content rating questionnaire (shopping app — no mature content)
- [ ] Target audience: 18+ (contains shopping/payments)

## Step 5 — Signing
- [ ] **ENROLL in Play App Signing** when prompted (recommended — Google holds the signing key)
- [ ] Keep `twa/android.keystore` backed up (alias `hellomobiles`, pass in AGENTS.md) — it's the UPLOAD key; loss = can't update the app later

## Step 6 — Pre-launch
- [ ] Internal testing track → add your own Google account as tester → install `app-release-signed.apk` on a real Android phone and test: login, product pages, cart, checkout, delivery tracking
- [ ] Verify fullscreen launch (no Chrome tab bar) — confirmed working via assetlinks
- [ ] Fix any pre-launch report items flagged by Google

## NOT needed for Play approval (but note)
- Live Razorpay/PhonePe keys (KYC) — test mode works for the review, but swap to live before real users pay
- FCM VAPID push — notifications code is ready in `sw.js` but needs a Firebase VAPID key to actually push; optional for launch
- Google Maps is already live on the site

## Estimated timeline
Account + verification: 1–3 days. App review: 1–7 days (usually faster). Expect **~1–2 weeks** to production.
