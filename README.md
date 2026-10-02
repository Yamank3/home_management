# Home Management App - Personal

A full-stack home management web app for managing groceries, bills, chores, household inventory, and meal planning. Runs locally on your home network — accessible from any browser or phone on the same WiFi.

**Stack:** React 18 · Vite · Tailwind CSS · Express · SQLite (Prisma) · JWT Auth

---

## Prerequisites

- [Node.js 18+](https://nodejs.org) — install via the website or `brew install node`

---

## First-Time Setup

### 1. Install dependencies

```bash
cd ~/Desktop/home-management
npm run install:all
```

### 2. Configure the server environment

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set:

```env
# A long random secret — change this before sharing on your network
JWT_SECRET=replace-with-a-long-random-string

# Path to the SQLite database file (will be created automatically)
DATABASE_URL=file:/Users/YOUR_USERNAME/home-management-data/app.db

PORT=3001
NODE_ENV=development
```

> **Tip:** Generate a strong secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Run the database migration

```bash
cd server
npx prisma migrate dev --name init
cd ..
```

This creates the SQLite database file and all tables. You only need to do this once (and again after schema changes).

### 4. Start the app

```bash
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:3001**

### 5. Create your household

Open http://localhost:5173 in your browser — you'll be redirected to the registration page.

Fill in:
- **Household name** — e.g. "The Smiths"
- **Your name** — your first name
- **Email** and **Password** (min. 6 characters)

This creates your household and makes you the **admin**.

---

## Adding Family Members

1. Sign in as admin
2. Go to **Account** (bottom nav or sidebar)
3. Click **Invite Member**
4. Fill in their name, email, and a password for them
5. They can now sign in at the same URL with those credentials
6. Share the invite details with them directly (in person or via message)

---

## Access from Your Phone

```bash
# Build and serve everything on one port
npm start
```

1. Find your Mac's LAN IP: **System Settings → Wi-Fi → Details → IP Address**
   (or run `ipconfig getifaddr en0` in Terminal)
2. Open `http://<your-ip>:3001` in your phone's browser
3. **Add to Home Screen** (iOS: share button → "Add to Home Screen" · Android: browser menu → "Add to Home Screen")

The app installs as a PWA — it looks and feels like a native app.

---

## Database

Data is stored in a single SQLite file:

```
~/home-management-data/app.db
```

### Useful commands

```bash
# Open the Prisma database browser (GUI)
cd server && npx prisma studio

# Reset the database (deletes all data)
cd server && npx prisma migrate reset

# Apply schema changes after editing schema.prisma
cd server && npx prisma migrate dev --name describe-your-change
```

### Backup

To back up your data, simply copy the database file:
```bash
cp ~/home-management-data/app.db ~/home-management-data/app.backup-$(date +%Y%m%d).db
```

---

## Project Structure

```
home-management/
├── server/
│   ├── prisma/
│   │   └── schema.prisma     # Database schema — edit here to change data models
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── validate.js       # Zod input validation helper
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── auth.js           # Register, login, logout, invite
│   │   ├── groceries.js
│   │   ├── bills.js
│   │   ├── chores.js
│   │   ├── inventory.js
│   │   ├── meals.js
│   │   └── dashboard.js
│   ├── db.js                 # Prisma client singleton
│   └── index.js              # Express app entry
└── client/
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Auth state (user, household, login, logout)
        ├── pages/
        │   ├── auth/             # Login, Register, Account pages
        │   ├── groceries/
        │   ├── bills/
        │   ├── chores/
        │   ├── inventory/
        │   └── meals/
        ├── hooks/                # Per-module data hooks
        ├── api.js                # All API calls in one place
        └── App.jsx               # Routes + auth guards
```

---

## What's Next — Production Readiness Roadmap

The app works great as a local household tool. Here's what to add next, in priority order:

---

### 1. HTTPS (High priority if accessing from phone)

PWA install on iOS and camera/microphone access require HTTPS. For LAN use:

```bash
# Install mkcert (creates locally-trusted certificates)
brew install mkcert
mkcert -install
mkcert localhost 192.168.1.42   # replace with your LAN IP

# Then configure Express to use the cert files
```

Or put the app behind a reverse proxy: **nginx + Certbot (Let's Encrypt)** if you expose it beyond your LAN.

---

### 2. Reminders (in-app done, push next)

The **Reminders** page, the "Needs attention" panel on the dashboard and the badge in the navigation show
bills due within 3 days or overdue, chores due or overdue, maintenance due, warranties expiring within 30 days
and low stock. They are computed on demand by `GET /api/reminders` (`server/utils/reminders.js`, tested with
`npm test --prefix server`); dismissals are remembered per device.

Still to do: **push notifications** for the Android app, reusing the same `buildReminders` list with a
scheduler and per-device tokens (the web service worker is already wired up for Web Push).

---

### 3. Run the database migration

```bash
cd server
npx prisma migrate dev --name init
cd ..
```

This creates the SQLite database file and all tables. You only need to do this once (and again after schema changes).

### 4. Start the app

```bash
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:3001**

### 5. Create your household

Open http://localhost:5173 in your browser — you'll be redirected to the registration page.

Fill in:
- **Household name** — e.g. "The Smiths"
- **Your name** — your first name
- **Email** and **Password** (min. 6 characters)

This creates your household and makes you the **admin**.

---

## Adding Family Members

1. Sign in as admin
2. Go to **Account** (bottom nav or sidebar)
3. Click **Invite Member**
4. Fill in their name, email, and a password for them
5. They can now sign in at the same URL with those credentials
6. Share the invite details with them directly (in person or via message)

---

## Access from Your Phone

```bash
# Build and serve everything on one port
npm start
```

1. Find your Mac's LAN IP: **System Settings → Wi-Fi → Details → IP Address**
   (or run `ipconfig getifaddr en0` in Terminal)
2. Open `http://<your-ip>:3001` in your phone's browser
3. **Add to Home Screen** (iOS: share button → "Add to Home Screen" · Android: browser menu → "Add to Home Screen")

The app installs as a PWA — it looks and feels like a native app.

---

## Database

Data is stored in a single SQLite file:

```
~/home-management-data/app.db
```

### Useful commands

```bash
# Open the Prisma database browser (GUI)
cd server && npx prisma studio

# Reset the database (deletes all data)
cd server && npx prisma migrate reset

# Apply schema changes after editing schema.prisma
cd server && npx prisma migrate dev --name describe-your-change
```

### Backup

To back up your data, simply copy the database file:
```bash
cp ~/home-management-data/app.db ~/home-management-data/app.backup-$(date +%Y%m%d).db
```

---

## Project Structure

```
home-management/
├── server/
│   ├── prisma/
│   │   └── schema.prisma     # Database schema — edit here to change data models
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── validate.js       # Zod input validation helper
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── auth.js           # Register, login, logout, invite
│   │   ├── groceries.js
│   │   ├── bills.js
│   │   ├── chores.js
│   │   ├── inventory.js
│   │   ├── meals.js
│   │   └── dashboard.js
│   ├── db.js                 # Prisma client singleton
│   └── index.js              # Express app entry
└── client/
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Auth state (user, household, login, logout)
        ├── pages/
        │   ├── auth/             # Login, Register, Account pages
        │   ├── groceries/
        │   ├── bills/
        │   ├── chores/
        │   ├── inventory/
        │   └── meals/
        ├── hooks/                # Per-module data hooks
        ├── api.js                # All API calls in one place
        └── App.jsx               # Routes + auth guards
```

---

## What's Next — Production Readiness Roadmap

The app works great as a local household tool. Here's what to add next, in priority order:

---

### 1. HTTPS (High priority if accessing from phone)

PWA install on iOS and camera/microphone access require HTTPS. For LAN use:

```bash
# Install mkcert (creates locally-trusted certificates)
brew install mkcert
mkcert -install
mkcert localhost 192.168.1.42   # replace with your LAN IP

# Then configure Express to use the cert files
```

Or put the app behind a reverse proxy: **nginx + Certbot (Let's Encrypt)** if you expose it beyond your LAN.

---

### 2. Push Notifications / Reminders

The service worker (via `vite-plugin-pwa`) is already wired up. Add Web Push to send reminders for:
- Chores due today
- Bills due in 3 days
- Empty meal plan days

**Libraries:** `web-push` (server) — the service worker and manifest are already in place.

---

### Android App (debug APK)

The Android app is the web app wrapped with Capacitor (`client/android`). It talks to the server named in
`client/.env.android`, so deploy the latest server first.

Build tools: JDK 21 and the Android SDK (platform 36, build-tools 36.0.0). Then, from `client/`:

```bash
export JAVA_HOME=/path/to/jdk-21 ANDROID_HOME=/path/to/Android/Sdk
npm run android:apk
```

The APK is written to `client/android/app/build/outputs/apk/debug/app-debug.apk`; copy it to a phone and install
it (allow "install unknown apps"). Re-run `npm run icons` after changing the logo, and `npm run android:open`
to use Android Studio instead.

**Testing against your own PC (no deploy needed):** start the server (`npm run dev` in the repo root), run
`npm run android:local` in `client/`, then press Run in Android Studio. The emulator reaches your PC at
`10.0.2.2` (set in `client/.env.android-local`; use your LAN IP for a physical phone). This uses a debug-only
manifest that allows plain-http, so it can't leak into a release build. Run `npm run android:apk` to go back to
the production configuration. A Play Store release additionally needs a signing key and an `.aab`
(`./gradlew bundleRelease`).

---

### Live Sync (done)

When anyone in the household changes something, everyone else's open screen updates by itself. The server keeps
one Server-Sent Events stream per signed-in device (`GET /api/events`, `server/utils/realtime.js`) and announces
which areas changed; screens refetch through `useLiveSync` (`client/src/context/LiveSyncContext.jsx`). The
sender's own device skips its own change, the client reconnects with backoff, and a 60-second refetch is a safety
net if a proxy buffers the stream.

Notes: the hub is in memory, so run a single server instance (scaling out needs a shared bus such as Redis). If you
serve the web app through the Netlify `/api` proxy, long-lived streams may be cut off; the fallback keeps screens
fresh, but pointing `VITE_API_URL` straight at the server gives true instant updates.

---

### 3. Recurring Bills (done)

Paying a recurring bill moves it to its next due date and shows it as "Paid" until that date is close
(2 days for weekly, 5 for biweekly, 7 for monthly, 14 for quarterly, 30 for annual), when it becomes
payable again. This runs when bills are loaded, so no scheduler is needed. Un-paying restores the previous
date. Logic lives in `server/utils/billCycle.js`; run its tests with `npm test --prefix server`.

---

### 4. Start the app

```bash
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:3001**

### 5. Create your household

Open http://localhost:5173 in your browser — you'll be redirected to the registration page.

Fill in:
- **Household name** — e.g. "The Smiths"
- **Your name** — your first name
- **Email** and **Password** (min. 6 characters)

This creates your household and makes you the **admin**.

---

## Adding Family Members

1. Sign in as admin
2. Go to **Account** (bottom nav or sidebar)
3. Click **Invite Member**
4. Fill in their name, email, and a password for them
5. They can now sign in at the same URL with those credentials
6. Share the invite details with them directly (in person or via message)

---

## Access from Your Phone

```bash
# Build and serve everything on one port
npm start
```

1. Find your Mac's LAN IP: **System Settings → Wi-Fi → Details → IP Address**
   (or run `ipconfig getifaddr en0` in Terminal)
2. Open `http://<your-ip>:3001` in your phone's browser
3. **Add to Home Screen** (iOS: share button → "Add to Home Screen" · Android: browser menu → "Add to Home Screen")

The app installs as a PWA — it looks and feels like a native app.

---

## Database

Data is stored in a single SQLite file:

```
~/home-management-data/app.db
```

### Useful commands

```bash
# Open the Prisma database browser (GUI)
cd server && npx prisma studio

# Reset the database (deletes all data)
cd server && npx prisma migrate reset

# Apply schema changes after editing schema.prisma
cd server && npx prisma migrate dev --name describe-your-change
```

### Backup

To back up your data, simply copy the database file:
```bash
cp ~/home-management-data/app.db ~/home-management-data/app.backup-$(date +%Y%m%d).db
```

---

## Project Structure

```
home-management/
├── server/
│   ├── prisma/
│   │   └── schema.prisma     # Database schema — edit here to change data models
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── validate.js       # Zod input validation helper
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── auth.js           # Register, login, logout, invite
│   │   ├── groceries.js
│   │   ├── bills.js
│   │   ├── chores.js
│   │   ├── inventory.js
│   │   ├── meals.js
│   │   └── dashboard.js
│   ├── db.js                 # Prisma client singleton
│   └── index.js              # Express app entry
└── client/
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Auth state (user, household, login, logout)
        ├── pages/
        │   ├── auth/             # Login, Register, Account pages
        │   ├── groceries/
        │   ├── bills/
        │   ├── chores/
        │   ├── inventory/
        │   └── meals/
        ├── hooks/                # Per-module data hooks
        ├── api.js                # All API calls in one place
        └── App.jsx               # Routes + auth guards
```

---

## What's Next — Production Readiness Roadmap

The app works great as a local household tool. Here's what to add next, in priority order:

---

### 1. HTTPS (High priority if accessing from phone)

PWA install on iOS and camera/microphone access require HTTPS. For LAN use:

```bash
# Install mkcert (creates locally-trusted certificates)
brew install mkcert
mkcert -install
mkcert localhost 192.168.1.42   # replace with your LAN IP

# Then configure Express to use the cert files
```

Or put the app behind a reverse proxy: **nginx + Certbot (Let's Encrypt)** if you expose it beyond your LAN.

---

### 2. Push Notifications / Reminders

The service worker (via `vite-plugin-pwa`) is already wired up. Add Web Push to send reminders for:
- Chores due today
- Bills due in 3 days
- Empty meal plan days

**Libraries:** `web-push` (server) — the service worker and manifest are already in place.

---

### 3. Recurring Bill Auto-Reset

Currently bills stay marked "Paid" forever. Add a nightly cron job that:
- Finds paid bills where `nextDueDate` has passed
- Resets `isPaid = false` and computes the next due date

**Library:** `node-cron` — add to `server/index.js`, runs in the same process.

```bash
npm install node-cron --prefix server
```

---

### 4. Data Export & Backup API

Add `GET /api/admin/export` that returns a ZIP containing all household data as JSON files. Wire up a daily backup to an iCloud or Dropbox folder using a cron job.

**Library:** `archiver` for ZIP creation.

---

### 5. Offline Support

Extend Workbox in `vite.config.js` to cache GET responses for all modules so the app works without internet:

```js
// In vite.config.js workbox config
runtimeCaching: [
  {
    urlPattern: /\/api\/(groceries|bills|chores|inventory|meals|dashboard)/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-data',
      networkTimeoutSeconds: 3,
      expiration: { maxAgeSeconds: 86400 }
    }
  }
]
```

---

### 6. Photo Attachments

Add a file upload endpoint so you can attach photos or receipts to:
- Inventory items (photos of appliances, manuals)
- Bills (receipt photos)

**Library:** `multer` for multipart uploads, store files in `~/home-management-data/uploads/`.

---

### 7. Budget Tracking

Extend the Bills module with:
- Monthly budget targets per category
- Actual vs. budget comparison chart on the dashboard
- Monthly spend history

---

### 8. Barcode Scanning for Groceries

Use the device camera to scan barcodes and auto-fill grocery item names.

**Library:** `@zxing/browser` (runs in the browser, no backend needed).

---

### 9. Shopping List QR Sharing

Generate a shareable QR code for a grocery list. Anyone who scans it gets a read-only view without needing an account — useful for a family member at the supermarket.

**Library:** `qrcode` (server-side generation).

---

### 10. Docker Deployment (access outside home network)

Package the app as a Docker container to run on a home server (Raspberry Pi, old laptop, NAS):

```dockerfile
# Dockerfile outline
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm run install:all && npm run build --prefix client
CMD ["npm", "start"]
```

With a `docker-compose.yml` + nginx reverse proxy, you can access your home manager from anywhere — not just your home WiFi.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens. Use a long random string. |
| `DATABASE_URL` | Yes | — | SQLite path: `file:/path/to/app.db` |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Set to `production` for prod build |
