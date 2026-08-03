# Hello Mobiles — Session Context

## Objective
Build out the Hello Mobiles store (MERN): 108-mobile inventory with IMEI tracking, real product images, sticky admin/employee sidebars, scroll-to-top on navigation, and now an "Electronics" category.

## Important Details
- Project: `/Users/apple/Desktop/Hello Mobiles web page/` (space in folder name — quote paths)
- GitHub repo: `https://github.com/GOWRICHARANCHERRY/Hello-Mobiles-web-page.git`
- Server port `5050`, Client port `3000`; MongoDB `mongodb://localhost:27017/hello_mobiles` (env key is `MONGODB_URI`, NOT `MONGO_URI`)
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
- All 108 Mobiles: variants + 6,043 unique IMEIs + real verified images (0 placeholders)
- IMEI lookup `GET /api/products/imei/:code`; fixed orders.js bug (`product` out of scope → `items.some()`); test order HM1003 → IMEI `863456906168269` marked `sold` with `soldAt` + order link
- Admin/Employee sidebars sticky: `md:static` → `md:sticky md:top-0 md:h-screen` in `AdminLayout.jsx` + `EmployeeLayout.jsx`
- ScrollToTop.jsx mounted inside `<BrowserRouter>` in `App.jsx` → pages open from top
- Electronics category: 28 products seeded (server/seed_electronics.js, idempotent — clears Electronics first), category grid + footer links updated
- Home.jsx category grid now `grid-cols-4 md:grid-cols-7 xl:grid-cols-9` with new Electronics card (emerald chip SVG)
- Footer (CustomerLayout.jsx) added Electronics link after Earbuds
- Client builds clean (vite build OK)
- `localhost:3000` FIXED: old stale Vite dev server had died/blank — now fresh `vite --host` via LaunchAgent; page title + `/src/main.jsx` transform + `/api` proxy all return 200
- Firebase Admin FIXED (2 bugs): (a) `initFirebase()` was called at module scope in `routes/auth.js` BEFORE `dotenv.config()` ran in `server.js` (ESM import hoisting) → env keys were empty; moved the call to `server.js` after `dotenv.config()`. (b) firebase-admin v14 removed the default export → `admin.credential` was undefined; `config/firebase.js` now uses `import { initializeApp } from 'firebase-admin'` + `import { cert } from 'firebase-admin/app'`. Server log now: `Firebase Admin initialized`
- Google login restored: `GOOGLE_CLIENT_ID=851466331590-mg31lbo8k58gp9l7hhu793bu1r2dj0jg.apps.googleusercontent.com` (matches the client's hardcoded `clientId`) added to `server/.env`; `/api/auth/google` (routes/auth.js:164) now has its audience

### Active
- None — awaiting next request

### Pending / Not Done
- Home Appliances (6) + Furniture (6) images verified/fixed earlier but pages may still show stale — re-check if needed
- Cloudflare quick tunnel: data path previously broken on this network — FIXED by changing the LaunchAgent origin from `http://localhost:5050` to `http://127.0.0.1:5050` (launchd env couldn't reach `localhost`). Now fully working from any device: `https://labeled-regarded-thanks-usage.trycloudflare.com`. NOTE: each cloudflared restart assigns a NEW random URL — grab it from `/tmp/hm-tunnel.log` after `launchctl kickstart -k gui/$(id -u)/com.hellomobiles.tunnel`

## Next Move
1. LIVE full-stack URL (works from any device): `https://labeled-regarded-thanks-usage.trycloudflare.com` — cloudflared quick tunnel to 127.0.0.1:5050 (server serves API + built client from `client/dist`). Tunnel is temporary: lasts while this machine is on. Restart: `launchctl kickstart -k gui/$(id -u)/com.hellomobiles.tunnel` (new random URL after each restart — read `/tmp/hm-tunnel.log`). Manual (shell) alternative: `/usr/local/bin/cloudflared tunnel --url http://127.0.0.1:5050 --no-autoupdate` (installed at /usr/local/bin, NOT in PATH)
2. GitHub Pages `https://gowricharancherry.github.io/Hello-Mobiles-web-page/` is frontend-only (no backend)
3. For a permanent public URL: deploy backend (Render/Railway) + MongoDB Atlas
4. All work is committed + pushed to `main`; deployed build is on `gh-pages` branch
5. Note: local router DNS cached NXDOMAIN for trycloudflare.com briefly; flush with `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder` if it lingers

## Relevant Files
- `server/seed_full_inventory.js` — 120-product seed (108 mobiles + 12 others)
- `server/seed_electronics.js` — NEW 28-product Electronics seed (idempotent)
- `server/fix_images.js` — re-runnable image-fix script (model name → image URL)
- `server/migrate_variants.js`, `server/fix_imei_images.js` — variant/IMEI migrations
- `server/routes/products.js`, `server/routes/orders.js`, `server/models/Product.js` — IMEI schema + order-sold marking
- `server/config/firebase.js` — Firebase Admin init (`cert` from `firebase-admin/app`; env `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`)
- `server/server.js` — calls `dotenv.config()` then `initFirebase()` (order matters: ESM imports run first)
- `client/src/utils/firebase.js` — client Firebase web config (apiKey etc., hardcoded) for phone OTP
- `client/src/App.jsx`, `client/src/components/ScrollToTop.jsx` — scroll-to-top
- `client/src/pages/admin/AdminLayout.jsx`, `client/src/pages/employee/EmployeeLayout.jsx` — sticky sidebars
- `client/src/pages/customer/Home.jsx` — category grid (hardcoded `categories` array, ~line 8)
- `client/src/pages/customer/CustomerLayout.jsx` — footer category links (~lines 308–316)
- `client/src/pages/customer/ProductList.jsx` — categories/brands loaded from API (`/products/categories`, `/products/brands`); filter via `/products?<query>`
- LaunchAgents: `~/Library/LaunchAgents/com.hellomobiles.{server,client,tunnel}.plist` — run node server.js / vite --host / cloudflared http2
