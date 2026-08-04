# Hello Mobiles — Session Context

## Objective
Build out the Hello Mobiles store (MERN): 108-mobile inventory with IMEI tracking, real product images, sticky admin/employee sidebars, scroll-to-top on navigation, and now an "Electronics" category.

## PRODUCTION (permanent) — LIVE
- **Site: `https://hello-mobiles.com`** (www → 301 redirect to root). Domain bought at **Cloudflare Registrar** (accounts: `danthamsettygowricharan17@gmail.com` / GOWRICHARANCHERRY)
- **Hosting: Render** web service `hello-mobiles` (Free, Singapore, srv-d9oeuevlk1mc738f8fkg) → `https://hello-mobiles.onrender.com`. Root `package.json` builds client + server; auto-deploys on push to `main`
- **Database: MongoDB Atlas** cluster `Hellomobiles` (M0 Free, AWS Mumbai). User `donthamsettygowricharan_db_user` / pw in `.env.render`. URI: `mongodb+srv://donthamsettygowricharan_db_user:<pw>@hellomobiles.gtcobzs.mongodb.net/hello_mobiles`
- **DNS**: Cloudflare (hello-mobiles.com) — 2 CNAME records (root `@` + `www`) → `hello-mobiles.onrender.com`, **DNS only** (grey cloud, NOT proxied — proxied fails with "DNS points to prohibited IP" because Render is behind Cloudflare)
- Render free tier: 2 custom domains only; sleeps after 15min idle (first visit ~30-60s wake); certs auto-issued per custom domain
- **Keep-alive**: `.github/workflows/keepalive.yml` pings `https://hello-mobiles.com` every 14 min via GitHub Actions (repo is PUBLIC → free unlimited minutes; runs from GitHub's servers, independent of this Mac). Schedule `*/14 * * * *`
- **Repo keep-alive**: `.github/workflows/repo_keepalive.yml` self-commits `.github/keepalive.txt` on the 1st & 15th of each month → counts as repo activity → prevents GitHub's 60-day inactive-repo shutdown of scheduled workflows. Optional: add Render Build Filter ignored path `.github/**` to stop those pushes triggering redeploys
- Render env vars loaded from `.env.render` (gitignored): MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (literal `\n`), WhatsApp: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TO (see New Order Notifications below), and `VITE_GOOGLE_MAPS_KEY` (client build-time; see Google Maps picker below)
- Local dev still uses LaunchAgents + local MongoDB (see below); local DB was migrated to Atlas (mongodump/mongorestore)

## Important Details
- Project: `/Users/apple/Desktop/Hello Mobiles web page/` (space in folder name — quote paths)
- GitHub repo: `https://github.com/GOWRICHARANCHERRY/Hello-Mobiles-web-page.git`
- Server port `5050`, Client port `3000`; local MongoDB `mongodb://localhost:27017/hello_mobiles` (env key is `MONGODB_URI`, NOT `MONGO_URI`)
- Credentials: Admin `9999999999`/`admin123`, Employee `8888888888`/`emp123`, Customer `7777777777`/`cust123`
- Server IS currently running on 5050 (API responds live)
- Firebase/Google login RESTORED: `server/.env` now has `GOOGLE_CLIENT_ID` (from client), `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (source: Service Account JSON `~/Downloads/hello-mobiles-webpage-firebase-adminsdk-fbsvc-919e301710.json`). Server log now shows `Firebase Admin initialized`
- Servers now run via macOS LaunchAgents (persist + auto-restart): `com.hellomobiles.server` (node server.js → 5050), `com.hellomobiles.client` (vite --host → 3000), `com.hellomobiles.tunnel` (cloudflared http2). Restart one: `launchctl kickstart -k gui/$(id -u)/com.hellomobiles.<name>`. NOTE: server runs `node server.js` directly (NO nodemon) — code changes need a manual kickstart restart
- Vite dev (3000) now runs `vite --host` (bound 0.0.0.0, reachable from LAN devices)

## Standing Rule (user instruction)
- IMMEDIATELY after every change (code, config, seeds, images, etc.), commit to git and push to GitHub (`main`) — do not wait to be asked. Check `git status`/`git diff` first, stage only intended files, write a concise commit message matching repo style.

## Inventory State
- Mobiles: 108, all with 3–6 variants, 6,043 unique 15-digit IMEIs (count == stock), real verified images (69 unique URLs, 0 broken)
- Home Appliances: 6, Furniture: 6 — images are gsmarena-hosted (e.g. `samsung-mw-ms20a.jpg`), SUSPECTED broken/404, NOT yet verified or fixed
- Electronics: 28 NEW products seeded via `server/seed_electronics.js` with verified Unsplash images (200), full specs/prices/stock/EMI
- Categories endpoint now returns: Electronics, Furniture, Home Appliances, Mobiles

## Electronics Category (new)
- 28 products: 2 TVs, 4 laptops, 2 tablets, 4 headphones/earbuds, 3 smartwatches, 3 speakers, 2 cameras, 3 gaming, 3 PC accessories, 2 networking
- Images use verified pattern: `https://images.unsplash.com/<id>?w=600&q=80&auto=format&fit=crop`
- Verified 200 Unsplash IDs: `photo-1496181133206-80ce9b88a853`, `photo-1517336714731-489689fd1ca8`, `photo-1593359677879-a4bb92f829d1`, `photo-1505740420928-5e560c06d30e`, `photo-1572569511254-d8f925fe2cbb`, `photo-1523275335684-37898b6baf30`, `photo-1608043152269-423dbba4e7e1`, `photo-1516035069371-29a1b244cc32`, `photo-1486401899868-0e435ed85128`, `photo-1527443224154-c4a3942d3acf`, `photo-1544244015-0df4b3ffc6b0`, `photo-1587829741301-dc798b83add3`, `photo-1527814050087-3793815479db`, `photo-1610945265064-0e34e5519bbf`, `photo-1600003014755-ba31aa59c4b6`, `photo-1587202372775-e229f172b9d7`, `photo-1547394765-185e1e68f34e`, `photo-1547082299-de196ea013d6`, `photo-1550751827-4bd374c3f58b`, `photo-1526406915894-7bcd65f60845`, `photo-1605100804763-247f67b3557e`, `photo-1618424181497-157f25b6ddd5`, `photo-1585790050230-5dd28404ccb9`, `photo-1601784551446-20c9e07cdbdb`, `photo-1550009158-9ebf69173e03`, `photo-1558618666-fcd25c85cd64`, `photo-1560769629-975ec94e6a86`, `photo-1541807084-5c52b6b3adef`
- 404 (DO NOT use): `photo-1544428584-e08b8e0d6a5d`, `photo-1563203369-26f2e2a5b0aa`, `photo-1564429238836-1d4b7f0a1c9c`, `photo-1578774296840-c5e1fbbf8a1a`
- gsmarena image URL pattern: `https://fdn2.gsmarena.com/vv/bigpic/<slug>.jpg`
- gsmarena.com site/search scraping blocked by Cloudflare (Turnstile); direct page/image URLs work
- Lava, AI+, Kara, Karban, I Call, Motorola A10 not in gsmarena — replaced with real substitute phone images

## Work State
### Completed
- **Preferred Language (Full app translation)**: new `client/src/context/LanguageContext.jsx` + `client/src/i18n/` — **5 areas × 3 langs** (en/hi/te, 1,210 keys total, perfect key parity verified): `customer-*` (552), `component-*` (193), `admin-*` (180), `admin2-*` (205), `employee-*` (80). Every page translated: 13 customer pages, 7 shared components (CustomerLayout, LoginPopup, SearchBar, HeroCarousel, TextBannerCarousel, ImeiScanModal, Login, Signup), 11 admin files, 4 employee files. Pattern: `const { t } = useLanguage();` + `t('cust.key', { var })`. Provider mounted in `App.jsx` (inside AuthProvider, so it reads `user.language`). Language persisted 3 ways: `localStorage['hm_language']`, `PUT /profile` → `User.language` (enum en/hi/te, default en, added to `server/models/User.js`), and header/dropdown label via `t('comp.langName')`/`t('comp.languagePref', { langName })`. Profile → Preferred Language tab now functional (checked radios call `handleLanguageChange` → `setLanguage` + save). Fallback: missing hi/te key → en → raw key. `t()` is pure lookup (NO server round-trip) — server only needs the `language` field on User
- All 108 Mobiles: variants + 6,043 unique IMEIs + real verified images (0 placeholders)
- IMEI lookup `GET /api/products/imei/:code`; fixed orders.js bug (`product` out of scope → `items.some()`); test order HM1003 → IMEI `863456906168269` marked `sold` with `soldAt` + order link
- Admin/Employee sidebars sticky: `md:static` → `md:sticky md:top-0 md:h-screen` in `AdminLayout.jsx` + `EmployeeLayout.jsx`
- ScrollToTop.jsx mounted inside `<BrowserRouter>` in `App.jsx` → pages open from top
- Electronics category: 28 products seeded (server/seed_electronics.js, idempotent — clears Electronics first), category grid + footer links updated
- Home.jsx category grid now `grid-cols-4 md:grid-cols-7 xl:grid-cols-9` with new Electronics card (emerald chip SVG)
- Footer (CustomerLayout.jsx) added Electronics link after Earbuds
- Client builds clean (vite build OK)
- **Mobile responsiveness audit (Aug 2026)**: automated headless-Chromium scan (Playwright) of every page at 360px/375px. Fixed: `min-w-0` + `overflow-x-hidden` on Admin/Employee main columns (stopped page-level horizontal scroll caused by `min-width:auto` flex children); `flex-wrap` on page header rows (AdminProducts/AdminEmployees/AdminCoupons/AdminLeads/EmployeeInventory/ProductList); data tables kept inside `overflow-x-auto` (scroll internally, verified no page-level overflow); fixed `{count}` interpolation bugs (ProductList `productsFound`, Orders `qty` were rendering literal `{count}`); `min-w-0`+`truncate` on table name cells + Orders item chips + AdminLeads email; ProductList price row `flex-wrap`
- `localhost:3000` FIXED: old stale Vite dev server had died/blank — now fresh `vite --host` via LaunchAgent; page title + `/src/main.jsx` transform + `/api` proxy all return 200
- Firebase Admin FIXED (2 bugs): (a) `initFirebase()` was called at module scope in `routes/auth.js` BEFORE `dotenv.config()` ran in `server.js` (ESM import hoisting) → env keys were empty; moved the call to `server.js` after `dotenv.config()`. (b) firebase-admin v14 removed the default export → `admin.credential` was undefined; `config/firebase.js` now uses `import { initializeApp } from 'firebase-admin'` + `import { cert } from 'firebase-admin/app'`. Server log now: `Firebase Admin initialized`
- Google login restored: `GOOGLE_CLIENT_ID=851466331590-mg31lbo8k58gp9l7hhu793bu1r2dj0jg.apps.googleusercontent.com` (matches the client's hardcoded `clientId`) added to `server/.env`; `/api/auth/google` (routes/auth.js:164) now has its audience
- **Google login on live site FIXED (4 things)**: (1) `google-auth-library` added to `server/package.json` (was installed locally only — missing on Render broke token verify); (2) `phone` field in `server/models/User.js` made `sparse unique` (NOT required) + Atlas/local `phone_1` index rebuilt sparse so new Google users (no phone) can save; (3) Google Cloud OAuth consent screen set **In production** + added JS origins `https://hello-mobiles.com`, `https://www.hello-mobiles.com`, `https://hello-mobiles.onrender.com` in project `851466331590`; (4) `LoginPopup.jsx` Google handler now also saves `user` to localStorage (token-only left you logged out after reload)
- **New order notifications (WhatsApp + ringing alarm)**: Meta WhatsApp Cloud API + polling alarm. Server: `server/utils/whatsapp.js` (`sendOrderWhatsApp(order, req.user)` — Meta Graph `v19.0/<PHONE_NUMBER_ID>/messages`, fire-and-forget called in `server/routes/orders.js` POST `/` after save; gated — logs `[WhatsApp] not configured` and no-ops until `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` are set). New lightweight `GET /api/orders/latest` (admin/employee, defined BEFORE `/:id`, returns newest order id/orderNumber/total/payment/status/createdAt + shippingAddress/customer name/phone) for the alarm poller. Client: `client/src/components/NewOrderNotifier.jsx` mounted in `AdminLayout.jsx` + `EmployeeLayout.jsx` — polls `/orders/latest` every 15s, and on a NEW order id (baseline set silently on first load; last-seen persisted in `localStorage['hm_last_order_id']`) plays a repeating Web Audio alarm (square beeps, no audio file), shows a click-to-dismiss toast (`toast.custom`, duration Infinity), and fires a browser Notification (permission requested on mount). No socket.io (chosen for Render free-tier robustness). 3 new i18n keys: `comp.newOrderTitle` / `comp.newOrderBody` (`{orderNumber}`, `{total}`) / `comp.newOrderStop` (parity 196/196/196)
  - **To activate WhatsApp** (user action needed): create a Meta developer app → WhatsApp → Cloud API → add test recipient / verify `+91 88868 88128` as recipient → copy `WHATSAPP_TOKEN` (System User access token) + `WHATSAPP_PHONE_NUMBER_ID` → add to `server/.env` (local) + `.env.render` (Render env vars, or Render Dashboard → Environment). NOTE: Meta allows free-form text only inside a 24h window after the store number messages the user; business-initiated alerts need an approved template — for now the util sends `type: 'text'` (switch to `type:'template'` + components if Meta rejects with message-template error)
- **Uber-style Google Maps location picker in Checkout** (`client/src/components/LocationPicker.jsx`): search box (Places Autocomplete) + draggable pin + tap-map-to-place + "Use Current Location" GPS button. Reverse-geocodes the exact dropped pin into street/city/state/pincode AND saves `latitude`/`longitude`/`mapLabel` on the order's `shippingAddress` (added to `server/models/Order.js`). Shipping form also has **Landmark** + optional **Alternate Phone** (`shippingAddress.landmark`, `shippingAddress.altPhone`, shown in AdminOrders/EmployeeOrders/OrderDetail + WhatsApp alert; i18n `cust.landmark`/`cust.altPhone`/`cust.optional`, `admin2.landmark`/`admin2.altPhone`, `emp.landmark`/`emp.altPhone`). WhatsApp alert now includes `📍 Map: https://www.google.com/maps?q=lat,lng`. Admin/Employee/OrderDetail order views show a "View on map" link when coords exist. Activated by `VITE_GOOGLE_MAPS_KEY` in `client/.env` (gitignored) + as a Render env var; **until a key is set, Checkout falls back to the old "Use Current Location" GPS + OpenStreetMap button** (no map shown). Google Maps is LIVE (key restricted to 3 referrers `https://hello-mobiles.com/*`, `https://www.hello-mobiles.com/*`, `https://hello-mobiles.onrender.com/*`, 35 APIs; billing: ₹3,000 prepayment trial, $200/mo free tier). New i18n keys: `comp.searchAddressPlaceholder` / `comp.dragPinHint` / `comp.mapsLoadFailed`, `cust.viewOnMap` / `admin2.viewOnMap` / `emp.viewOnMap`
  - **To activate Google Maps** (user action needed): in GCP project `851466331590` enable **Maps JavaScript API**, **Places API**, **Geocoding API** → create an API key (restrict to those 3 APIs + HTTP referrers `http://localhost:3000`, `https://hello-mobiles.com`, `https://www.hello-mobiles.com`, `https://hello-mobiles.onrender.com`) → paste into `client/.env` (`VITE_GOOGLE_MAPS_KEY=...`) locally + add the same value as a Render env var, then rebuild/restart (note: Vite inlines it at BUILD time — changing it requires a fresh `vite build` / Render deploy, not just a server restart)
- **Google Maps now fully renders on live checkout** (verified via Playwright): root cause was CSP `img-src` blocking map tiles — added `https://maps.googleapis.com`, `https://maps.gstatic.com`, `https://*.gstatic.com` to `img-src` (server/server.js). Zero CSP errors now
- **CSP-safe font preload**: replaced illegal inline `onload` (hash CSP can't whitelist event-handler attrs) with external `client/public/fonts.js` (flips `#gfonts-preload` rel to stylesheet) + removed `scriptSrcAttr` from helmet CSP. Live index.html has `<link rel="preload" id="gfonts-preload">` + `<script src="./fonts.js" defer>`
- **Recent searches in SearchBar** (`client/src/components/SearchBar.jsx`): searches saved to `localStorage['hm_recent_searches']` (max 8, dedup case-insensitive, most-recent first); when the bar is empty + focused a "Recent Searches" dropdown (Clock icon, gold header) shows with clickable terms + "Clear all". Saved on submit + "search all" clicks. Also re-shows after clicking the X clear button (empty-query effect no longer force-closes when focused + recents exist). New i18n keys `comp.recentSearches` / `comp.clearAll` (parity 201/201/201)
- **New-order alarm mobile fix** (`client/src/components/NewOrderNotifier.jsx`): mobile browsers block Web Audio until a user gesture — AudioContext is now created + resumed (with a near-silent unlock pulse) on the first tap/click/keydown/mousedown + on `visibilitychange`, kept alive between alarms (no longer closed on stop), gain raised to 0.4, and `navigator.vibrate` buzz added as a phone fallback. NOTE: phone tab must be foreground — mobile browsers pause timers in background tabs
- **Checkout shipping validation** (`client/src/pages/customer/Checkout.jsx`): "Continue to Payment" (step 1→2) now validates required fields via `validateShipping()` — name, 10-digit Indian phone (normalizes +91), address, city, state, 6-digit pincode — each with its own translated toast (`cust.toastEnterName`/`toastEnterPhone`/`toastValidPhone`/`toastEnterAddress`/`toastEnterCity`/`toastEnterState`/`toastEnterPincode`/`toastValidPincode`). Also reused in `handlePlaceOrder`. Customer i18n parity now 572/572/572
- **Saved addresses shown in Checkout** (`client/src/pages/customer/Checkout.jsx`): reads `localStorage['hm_addresses']` (same list as Profile → Saved Address) and shows selectable gold-highlighted address cards at the top of Step 1. Auto-selects + pre-fills the default (only filling empty fields so account address wins), clicking a card fills street/city/state/pincode/phone. "Manage addresses" link → `/profile?tab=address`. New i18n key `cust.manageAddresses`

### Active
- New-order notifications: code complete (WhatsApp util + `/orders/latest` + client alarm). Alarm works now; WhatsApp messages await user's Meta Cloud API credentials (see Completed)

### Pending / Not Done
- Home Appliances (6) + Furniture (6) images verified/fixed earlier but pages may still show stale — re-check if needed
- Cloudflare quick tunnel: data path previously broken on this network — FIXED by changing the LaunchAgent origin from `http://localhost:5050` to `http://127.0.0.1:5050` (launchd env couldn't reach `localhost`). Now fully working from any device: `https://labeled-regarded-thanks-usage.trycloudflare.com`. NOTE: each cloudflared restart assigns a NEW random URL — grab it from `/tmp/hm-tunnel.log` after `launchctl kickstart -k gui/$(id -u)/com.hellomobiles.tunnel`

## Next Move
1. **Permanent live site: `https://hello-mobiles.com`** (Render + Atlas + Cloudflare DNS-only, see PRODUCTION above). Render free tier sleeps after 15min idle — first visit ~30-60s wake. Restart/deploy: push to `main` (auto-deploy) or Render dashboard Manual Deploy
2. Tunnel (temporary, local machine only) still available: `https://labeled-regarded-thanks-usage.trycloudflare.com` — restart: `launchctl kickstart -k gui/$(id -u)/com.hellomobiles.tunnel` (new random URL after each restart — read `/tmp/hm-tunnel.log`)
3. GitHub Pages `https://gowricharancherry.github.io/Hello-Mobiles-web-page/` is frontend-only (no backend) — superseded by Render
4. All work is committed + pushed to `main`; deployed build is on `gh-pages` branch
5. Note: local router DNS cached NXDOMAIN briefly; flush with `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder` if it lingers (sudo needs terminal password)
6. TODO: add `hello-mobiles.com` + `www.hello-mobiles.com` to Firebase **Authorized Domains** (Authentication → Settings) for Google/phone login to work on the live domain

## Relevant Files
- `client/src/context/LanguageContext.jsx` — i18n provider (`useLanguage()` → `{ language, setLanguage, t }`; t() does key→translation lookup w/ `{var}` interpolation, falls back en→key). Provider in App.jsx inside AuthProvider
- `client/src/i18n/` — 15 dictionary files (customer/component/admin/admin2/employee × en/hi/te) + `index.js` merge. Keys MUST stay in sync across the 3 langs of each area (parity-check: node key-scan script)
- `server/models/User.js` — `language` field (enum en/hi/te, default en); `PUT /api/profile` accepts it
- `server/seed_full_inventory.js` — 120-product seed (108 mobiles + 12 others)
- `server/seed_electronics.js` — NEW 28-product Electronics seed (idempotent)
- `server/fix_images.js` — re-runnable image-fix script (model name → image URL)
- `server/migrate_variants.js`, `server/fix_imei_images.js` — variant/IMEI migrations
- `server/routes/products.js`, `server/routes/orders.js`, `server/models/Product.js` — IMEI schema + order-sold marking
- `server/utils/whatsapp.js` — Meta WhatsApp Cloud API order alert (`sendOrderWhatsApp`, `buildOrderMessage`; gated on WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_TO)
- `server/routes/orders.js` — `GET /api/orders/latest` (lightweight, before `/:id`) + WhatsApp fire-and-forget on POST `/`
- `client/src/components/NewOrderNotifier.jsx` — admin/employee new-order alarm (15s poll → Web Audio beeps + toast + Notification, stop on click)
- `client/src/components/LocationPicker.jsx` — Google Maps picker (search + draggable pin + GPS); gated on `VITE_GOOGLE_MAPS_KEY` (empty → renders nothing, Checkout falls back to OSM)
- `client/.env` — `VITE_GOOGLE_MAPS_KEY=` placeholder (gitignored; must ALSO be set as a Render env var since Vite inlines it at build time)
- `server/config/firebase.js` — Firebase Admin init (`cert` from `firebase-admin/app`; env `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`)
- `server/server.js` — calls `dotenv.config()` then `initFirebase()` (order matters: ESM imports run first)
- `client/src/utils/firebase.js` — client Firebase web config (apiKey etc., hardcoded) for phone OTP
- `client/src/App.jsx`, `client/src/components/ScrollToTop.jsx` — scroll-to-top
- `client/src/pages/admin/AdminLayout.jsx`, `client/src/pages/employee/EmployeeLayout.jsx` — sticky sidebars
- `client/src/pages/customer/Home.jsx` — category grid (hardcoded `categories` array, ~line 8)
- `client/src/pages/customer/CustomerLayout.jsx` — footer category links (~lines 308–316)
- `client/src/pages/customer/ProductList.jsx` — categories/brands loaded from API (`/products/categories`, `/products/brands`); filter via `/products?<query>`
- LaunchAgents: `~/Library/LaunchAgents/com.hellomobiles.{server,client,tunnel}.plist` — run node server.js / vite --host / cloudflared http2
