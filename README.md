# ⛪ Church Directory & Songbook Application

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)

A modern, secure, and fully-featured web application built with **Next.js**, **Firebase**, and **Google Gemini AI**. Designed specifically for churches, assemblies, and congregations to seamlessly manage their member directory, interactive songbook, emergency blood registry, and community communications.

---

## 🌟 Key Features

* **AI-Powered Songbook:** A dynamic, searchable library of hymns and choruses.
  * **Smart Input:** Admins can paste raw text or upload photos of physical songbooks (OCR).
  * **AI Translation & Transliteration:** Google Gemini automatically detects the language, generates English and Malayalam phonetics (sing-along scripts), translates meanings, and researches the story/history behind the song.
  * **Author Indexing:** Automatic normalization of composer names (e.g., "V Nagel") with a dedicated index to view songs by author.
* **Interactive Map & Address Picker:** Users can set their exact home addresses using a live map powered by the Google Places Autocomplete API, with a robust fallback to OpenStreetMap/Leaflet.
* **Smart Directory:** Searchable family and individual member directory with deduplication, fast loading, and secure data access.
* **Role-Based Access Control (RBAC):** * 👑 **Admins:** Can bulk upload via CSV, bypass approval queues, manage users, edit any family/song, and view the system audit log.
  * 👤 **Approved Members:** Can view the directory, export PDFs, post to noticeboards, and submit their own family details for admin approval.
  * ⏳ **Pending Users:** Restricted to a secure "Waiting Room" until an admin explicitly approves their account.
* **Emergency Blood Registry:** Quickly find willing blood donors within the congregation, complete with 1-click WhatsApp and phone call routing directly to the individual's personal mobile.
* **Professional PDF Generation:** Generate formatted PDF directory books, single family cards, or songbook sheets with automatic pagination, timestamps, and generator watermarks.
* **Image Cropping & Hybrid Storage:** Built-in UI for members to perfectly crop family profile pictures before saving. Includes a dual-save system that uploads high-res photos to Firebase Storage while creating low-res Base64 backups in the database.

---

## 🔌 APIs, Services & Pricing Guide

This application leverages several powerful APIs. For most small to medium-sized churches, **these services will remain 100% free** due to generous free tiers.

### 1. Google Gemini API (Gemini 2.5 Flash)
* **Used for:** Processing songbook uploads (OCR from images, formatting lyrics, translating, and generating Malayalam/English phonetics).
* **Free Tier:** 15 Requests Per Minute (RPM), 1,500 Requests Per Day, and 1 Million Tokens Per Minute (TPM).
* **Paid Tier (If exceeded):** ~$0.075 per 1 Million input tokens.
* **Expectation:** Unless you are uploading thousands of songs per day, this will be **completely free**.

### 2. Google Maps Platform (Maps JS, Places, Geocoding)
* **Used for:** The interactive map picker, searching for addresses via autocomplete, and pinning exact GPS coordinates.
* **Free Tier:** Google provides a **$200 recurring monthly credit** for all Maps usage.
* **Costs (deducted from the $200 credit):**
  * Dynamic Maps Load: ~$7.00 per 1,000 loads.
  * Places Autocomplete: ~$17.00 to $28.00 per 1,000 requests.
  * Geocoding: ~$5.00 per 1,000 requests.
* **Expectation:** The $200 credit covers roughly 10,000 to 20,000 map interactions per month. For a standard church app, this will remain **100% free**.

### 3. Firebase (Auth, Firestore, Storage)
* **Used for:** Database, user authentication, and storing profile/songbook images.
* **Free Tier (Spark Plan):** 50,000 document reads per day, 20,000 writes per day. 5GB of total file storage.
* **Important Note:** To use Firebase Storage for uploading high-res images, you must upgrade your Firebase project to the **Blaze (Pay-as-you-go) Plan**. However, you will *not* be charged until you exceed the 5GB storage or 50k daily read limits.
* **Expectation:** Extremely low cost or **free**.

### 4. OpenStreetMap / Leaflet (Nominatim)
* **Used for:** Fallback map rendering and geocoding if Google Maps fails or exceeds quota.
* **Cost:** **100% Free** and open-source.

---

## 🚀 Tech Stack

**Frontend**
* Framework: [Next.js](https://nextjs.org/) (App Router)
* Styling: [Tailwind CSS](https://tailwindcss.com/)
* Maps: `@react-google-maps/api` & `react-leaflet`
* Icons: [Lucide React](https://lucide.dev/)

**Backend & Database**
* AI Processing: [Google Generative AI (Gemini)](https://aistudio.google.com/)
* Auth: [Firebase Authentication](https://firebase.google.com/docs/auth)
* Database: [Cloud Firestore](https://firebase.google.com/docs/firestore)
* File Storage: [Firebase Storage](https://firebase.google.com/docs/storage)

**Utilities**
* PDF Generation: [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html)
* Image Handling: `react-easy-crop`

---

## 🛠 Getting Started

### 1. Prerequisites
* Node.js **20 LTS** or later (pinned in [.nvmrc](.nvmrc) and enforced by the `engines` field in [package.json](package.json)). Run `nvm use` after cloning.
* A free [Firebase](https://console.firebase.google.com/) account (Blaze plan recommended for image storage).
* A free [Google AI Studio](https://aistudio.google.com/) account for the Gemini API Key.
* A free [Google Cloud Console](https://console.cloud.google.com/) account with Maps JavaScript API, Places API, and Geocoding API enabled.

### 2. Environment Variables
Copy [.env.example](.env.example) to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
# FIREBASE CONFIG
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# GOOGLE MAPS CONFIG
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# GEMINI AI CONFIG (Note: NOT prefixed with NEXT_PUBLIC_ for security)
GEMINI_API_KEY=your_gemini_api_key

# FIREBASE ADMIN (server-only). Provide EITHER the full JSON blob ...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
# ... OR the three split values (keep the literal \n escapes in the private key):
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Installation & Running

Clone the repository and install the dependencies with the locked tree:

```bash
git clone https://github.com/your-username/church-directory.git
cd church-directory
nvm use            # respects .nvmrc
npm ci             # deterministic install from package-lock.json
```

Start the development server:

```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 👑 First Admin Setup

For security, anyone who signs up automatically receives a `pending` role. You must manually promote the first user to become an admin.

1. Sign up for an account on your local or live app.
2. Go to your Firebase Firestore console.
3. Open the `users` collection, find your user document, and change the `role` field from `"pending"` to `"admin"`.
4. Refresh your app. You now have full access to the Admin Dashboard!

---

## 📊 CSV Bulk Upload Format

To import existing members via the Admin Dashboard, your CSV file **must** contain exactly 12 columns in the following order. Save your spreadsheet as a Comma Separated Values (`.csv`) file. To group multiple people into the same family card, ensure they have the exact same `Mobile` (Primary Mobile) number.

| Col | Name | Description | Required? |
| :--- | :--- | :--- | :--- |
| 1 | `FamilyName` | The display name for the household | **Yes** |
| 2 | `Mobile` | **Primary Family Mobile**. Groups members together. | **Yes** |
| 3 | `CurrentAddress` | Residential address | No |
| 4 | `NativeAddress` | Hometown or native address | No |
| 5 | `HomeAssembly` | Current church branch/assembly | No |
| 6 | `CommendedAssembly`| Originating commended assembly | No |
| 7 | `Notes` | General household notes | No |
| 8 | `MemberName` | The individual's full name | **Yes** |
| 9 | `BloodGroup` | e.g., A+, O-, AB+ | No |
| 10| `WillingToDonate`| `TRUE` or `FALSE` | No |
| 11| `Tags` | Comma-separated (e.g., `youth, choir`) | No |
| 12| `MemberMobile` | The individual's personal mobile number | No |

---

## 🔒 Firebase Security Rules

Navigate to **Firestore Database** > **Rules** and apply:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isLoggedIn() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isAdmin() { return isLoggedIn() && getUserData().role == 'admin'; }
    function isApproved() { return isLoggedIn() && (getUserData().role == 'approved' || getUserData().role == 'admin'); }

    match /users/{userId} {
      allow read: if isLoggedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isLoggedIn() && request.auth.uid == userId && request.resource.data.role == 'pending';
      allow update, delete: if isAdmin();
    }
    match /members/{memberId} {
      allow read, create, update: if isApproved();
      allow delete: if isAdmin();
    }
    match /songs/{songId} {
      allow read: if isApproved();
      allow create, update, delete: if isAdmin();
    }
    match /notices/{noticeId} {
      allow read, create: if isApproved();
      allow update, delete: if isAdmin();
    }
    match /activity_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isLoggedIn();
      allow update, delete: if false;
    }
  }
}
```

### Storage Rules
Navigate to **Storage** > **Rules** and apply:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.contentType.matches('image/.*')
                   && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

---

## 🌍 Deployment & Custom Domains

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com). Ensure you add all your Environment Variables in the Vercel project settings.

**Security Note:** Be sure to restrict your Google Maps API key in the Google Cloud Console to only allow HTTP referrers from your specific Vercel domain and `http://localhost:3000`.

### Configuring CORS for PDF Exports (Custom Domains)
If you purchase a custom domain, you must tell Firebase Storage to allow your domain to download images for PDF generation.

1. Go to your Google Cloud Console dashboard.
2. Open the **Cloud Shell** (terminal icon in the top right).
3. Run the following command *(Update the URLs inside the brackets!)*:

```bash
echo '[{"origin": ["[https://your-actual-app.vercel.app](https://your-actual-app.vercel.app)", "http://localhost:3000", "[https://www.your-custom-domain.com](https://www.your-custom-domain.com)"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
```

4. Apply the policy to your specific Firebase Storage bucket:

```bash
gsutil cors set cors.json gs://your-project-id.firebasestorage.app
```

---

## 🧭 Solution Structure

This is a single-project **Next.js 16 (App Router)** application written in TypeScript. There are no additional projects, workspaces, or class libraries — the entire codebase is contained in this repository.

| Area | Path | Purpose |
| :--- | :--- | :--- |
| App shell | [app/layout.tsx](app/layout.tsx), [app/globals.css](app/globals.css) | Root layout, global styles, `AuthProvider`, PWA install prompt, service worker registration |
| Public pages | [app/page.tsx](app/page.tsx), [app/beliefs/page.tsx](app/beliefs/page.tsx), [app/visit/page.tsx](app/visit/page.tsx), [app/privacy/page.tsx](app/privacy/page.tsx), [app/terms/page.tsx](app/terms/page.tsx), [app/sunday-school/page.tsx](app/sunday-school/page.tsx), [app/youth/page.tsx](app/youth/page.tsx) | SEO-facing marketing / info pages |
| Auth flow | [app/login/page.tsx](app/login/page.tsx), [app/waiting-room/page.tsx](app/waiting-room/page.tsx), [app/api/session/route.ts](app/api/session/route.ts) | Firebase client sign-in, session cookie mint/clear, pending-user holding page |
| Directory | [app/directory/page.tsx](app/directory/page.tsx), [app/add-family/page.tsx](app/add-family/page.tsx), [app/edit-family/[id]/page.tsx](app/edit-family/%5Bid%5D/page.tsx), [app/bachelors/page.tsx](app/bachelors/page.tsx), [app/blood-registry/page.tsx](app/blood-registry/page.tsx) | Family/member CRUD, filters, PDF export |
| Songbook | [app/songbook/page.tsx](app/songbook/page.tsx), [app/songbook/add/page.tsx](app/songbook/add/page.tsx), [app/songbook/[id]/page.tsx](app/songbook/%5Bid%5D/page.tsx), [app/songbook/[id]/edit/page.tsx](app/songbook/%5Bid%5D/edit/page.tsx), [app/api/process-song/route.ts](app/api/process-song/route.ts) | Song CRUD, AI processing via Gemini |
| Admin & approvals | [app/admin/page.tsx](app/admin/page.tsx), [app/approvals/page.tsx](app/approvals/page.tsx), [app/manage-users/page.tsx](app/manage-users/page.tsx), [app/activity-log/page.tsx](app/activity-log/page.tsx) | Admin dashboard, moderation queue, user role management, audit log |
| Member dashboard | [app/dashboard/page.tsx](app/dashboard/page.tsx), [app/dashboard/beliefs/page.tsx](app/dashboard/beliefs/page.tsx) | Authenticated home, private statement of faith |
| Community | [app/meetings/page.tsx](app/meetings/page.tsx), [app/prayer/page.tsx](app/prayer/page.tsx) | Meeting schedule, prayer points |
| Server actions | [app/actions/dbActions.ts](app/actions/dbActions.ts) | `'use server'` writes for members, users, meetings, prayer, songs — all gated by `requireUser` / `requireAdmin` |
| Shared UI | [components/](components) — `TopBar`, `PublicNavbar`, `Footer`, `DirectoryCard`, `SubDirectory`, `MapPicker`, `LocationPicker`, `InstallPrompt` | Reusable client components |
| Library | [lib/](lib) — `firebase.ts`, `firebase-admin.ts`, `auth-session.ts`, `AuthContext.tsx`, `rate-limit.ts`, `logger.ts`, `imageUtils.ts` | Firebase SDK wiring, session helpers, client auth context, edge rate limiter, activity logger, image resize/crop utils |
| Content | [data/beliefsContent.ts](data/beliefsContent.ts) | Static doctrinal content consumed by beliefs pages |
| Edge proxy | [proxy.ts](proxy.ts) | CSP, security headers, IP-based rate limiting (renamed from `middleware.ts` per Next.js 16 deprecation) |
| PWA assets | [public/manifest.json](public/manifest.json), [public/sw.js](public/sw.js) | Web app manifest, service worker |
| SEO | [app/robots.ts](app/robots.ts), [app/sitemap.ts](app/sitemap.ts) | Generated robots and sitemap |

---

## 🏛 Architecture Summary

**Style:** Single-tier Next.js App Router application with a two-plane trust model.

- **Client plane** — React 19 client components under [app/](app). State comes from [lib/AuthContext.tsx](lib/AuthContext.tsx), which subscribes to Firebase Auth and the `users/{uid}` Firestore document via `onSnapshot`. Reads are direct-to-Firestore from the browser using the client SDK ([lib/firebase.ts](lib/firebase.ts)) and are gated by Firestore Security Rules.
- **Server plane** — Server Actions ([app/actions/dbActions.ts](app/actions/dbActions.ts)) and Route Handlers ([app/api/session/route.ts](app/api/session/route.ts), [app/api/process-song/route.ts](app/api/process-song/route.ts)) run on the Node runtime. They use the Firebase Admin SDK ([lib/firebase-admin.ts](lib/firebase-admin.ts)) and verify the httpOnly `session` cookie via [lib/auth-session.ts](lib/auth-session.ts).

**Dependency direction (one-way):**

```
components/  ─┐
app/*/page  ─┼─► lib/AuthContext ─► lib/firebase (client SDK)
              │
app/actions ─┼─► lib/auth-session ─► lib/firebase-admin (Admin SDK)
app/api/*   ─┘
```

`lib/` never imports from `app/` or `components/`. Client code never imports `firebase-admin`. Server code never imports `AuthContext`.

**Patterns actually used:**

- **Server Actions** for all authoritative writes ([app/actions/dbActions.ts](app/actions/dbActions.ts)).
- **Layered access control** — `requireUser` / `requireAdmin` guards on every server action; Firestore Security Rules as the second line of defense.
- **Dual-path server auth** — every server action accepts an optional trailing `token?: string | null` argument (client passes `await auth.currentUser?.getIdToken()`). `requireUser` / `requireAdmin` verify the token via `getAdminAuth().verifyIdToken(token, true)` first and fall back to the 5-day httpOnly session cookie minted at `POST /api/session`. Both paths check for revoked/deleted users.
- **Reactive context provider** ([lib/AuthContext.tsx](lib/AuthContext.tsx)) for global auth state.
- **Approval workflow / draft-diff pattern** — non-admin edits are staged into `draftData` with `hasPendingEdit` / `isPendingCreation` flags until an admin merges them.
- **Edge rate limiting** via an in-memory bucket in [lib/rate-limit.ts](lib/rate-limit.ts), invoked from [proxy.ts](proxy.ts) and the Gemini route.
- **PWA** via [public/manifest.json](public/manifest.json) and a hand-rolled [public/sw.js](public/sw.js).

---

## 🔁 Key Business Flows

**1. Authentication & role provisioning**

`Login` → Firebase Auth sign-in → client posts ID token to `POST /api/session` → Admin SDK mints httpOnly session cookie → `AuthContext` subscribes to `users/{uid}` → user lands in `/waiting-room` (pending), `/dashboard` (approved), or `/admin` (admin).

**2. Family submission & approval**

`add-family` (client) → `createFamilySubmission` server action → writes to `members/{id}` with `isPendingCreation: true` unless caller is admin → admin visits `/approvals` → `approveFamilyCreation` clears the flag and records an entry in `activity_logs`.

**3. Family edit with draft-diff**

`edit-family/[id]` → `updateFamilySubmission` → if non-admin, writes proposed values to `draftData` and sets `hasPendingEdit: true` → admin sees the diff on `/approvals` → `approveFamilyEdit` merges `draftData` into the document.

**4. AI-assisted song ingestion**

`songbook/add` uploads image(s) or pastes text → `POST /api/process-song` (rate-limited, session-gated) → server calls Gemini 2.5 Flash with a strict JSON system prompt → response includes transliterations and meanings → client persists via `createSong` server action, which auto-assigns the next `songNumber`.

**5. User management**

`approvals` → `approveUserAccess` / `rejectUserAccess` mutate `users/{uid}.role`. `manage-users` → `deleteUserAccount` deletes the Firestore profile, calls `revokeRefreshTokens(uid)`, and best-effort deletes the Firebase Auth user so the removed member cannot re-authenticate. The deleted user's live `AuthContext` `onSnapshot` also fires and auto-signs them out plus clears the httpOnly `session` cookie via `DELETE /api/session`. Every admin action appends an `activity_logs` document.

**6. PWA install & offline shell**

[app/layout.tsx](app/layout.tsx) registers `/sw.js`. `InstallPrompt` component surfaces the `beforeinstallprompt` event. `manifest.json` supplies icons, theme color, and start URL.

---

## 🌐 External Dependencies

| Category | Service | Used By |
| :--- | :--- | :--- |
| Database | Cloud Firestore | Client SDK (reads) + Admin SDK (writes). Collections: `users`, `members`, `songs`, `notices`, `activity_logs`, `meetings`, `prayer_points` |
| Auth | Firebase Authentication | Email/password sign-in; session-cookie exchange in `/api/session` |
| File Storage | Firebase Storage | Family photos, songbook images |
| AI | Google Gemini 2.5 Flash (`GEMINI_API_KEY`) | `/api/process-song` OCR + transliteration + translation |
| Maps (primary) | Google Maps JS API, Places Autocomplete, Geocoding | `MapPicker`, `LocationPicker` |
| Maps (fallback) | OpenStreetMap tiles + Nominatim via `react-leaflet` | `MapPicker` fallback |
| Hosting | Vercel (implied by `serverExternalPackages` config and Next.js defaults) | App hosting, edge middleware, serverless functions |
| PWA | Web App Manifest + custom Service Worker | `/manifest.json`, `/sw.js` |

No message queues, event buses, or background workers are used. There is no external monitoring integration configured in the repo.

---

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and use it for your own congregation.

---

## 🧾 Generated Metadata

- Last Repository Scan: 2026-07-23
- Last Documentation Refresh: 2026-07-23
- Last Dead-Code Cleanup: 2026-07-22
- Last Long-Term Stability Audit: 2026-07-22
- Last Auth Hardening Pass: 2026-07-23

### 2026-07-23 — Auth Hardening Pass

Eliminates the `TypeError` in `verifyIdToken`, the transient `Unauthorized` errors on `/songbook/add` and `/edit-family/[id]`, and closes the previously-noted session revocation gap:

1. **Firebase Admin credential validation.** [lib/firebase-admin.ts](lib/firebase-admin.ts) now normalizes `FIREBASE_PRIVATE_KEY` via `.replace(/\\n/g, '\n')`, strips wrapping quotes, asserts `BEGIN PRIVATE KEY`, and throws a descriptive Error listing missing env vars — no more silent init with undefined credentials.
2. **Token-based server auth.** Every server action in [app/actions/dbActions.ts](app/actions/dbActions.ts) accepts an optional trailing `token?: string | null`. Clients pass `await auth.currentUser?.getIdToken()`; the server verifies via `getAdminAuth().verifyIdToken(token, true)` (with revocation check) inside a try/catch that logs and throws `Error('Unauthorized')`. Session cookie remains the fallback.
3. **`/api/process-song` accepts `Authorization: Bearer <token>`.** Auth failures return `401 JSON` instead of crashing with a TypeError.
4. **`/api/session` surfaces real errors.** Logs the underlying failure and distinguishes 401 (auth) from 500 (config) so the source of a broken login is visible in Vercel logs.
5. **Instant admin-revocation is complete.** [app/actions/dbActions.ts](app/actions/dbActions.ts) `deleteUserAccount` now deletes the Firestore profile, calls `revokeRefreshTokens(uid)`, and best-effort `deleteUser(uid)` on Firebase Auth. [lib/AuthContext.tsx](lib/AuthContext.tsx) auto-kick now also clears the httpOnly `session` cookie via `DELETE /api/session` so server actions cannot continue to accept the deleted user for up to 5 days.

### 2026-07-22 — Long-Term Stability Audit

Hardening applied so the app can run 7–10 years with minimal intervention:

1. **Node runtime pinned.** Added [.nvmrc](.nvmrc) (`20.19.0`) and `engines.node: >=20.0.0 <25.0.0` in [package.json](package.json). Vercel and local dev will now refuse to build on incompatible Node.
2. **Deterministic installs.** All builds should use `npm ci` against a committed [package-lock.json](package-lock.json). This is now the documented install command.
3. **Environment template.** Added [.env.example](.env.example) so new deployments know exactly which variables are required. `.gitignore` was updated to un-ignore this file only.
4. **Health check.** Added [app/api/health/route.ts](app/api/health/route.ts) at `GET /api/health` for uptime monitors. Returns `{ status, timestamp, commit, region }` with `dynamic = 'force-dynamic'` and `runtime = 'nodejs'` so it never gets served from cache.
5. **`middleware.ts` → `proxy.ts` migration.** Next.js 16 deprecates the `middleware` file convention; Next.js 17 removes it. Renamed to [proxy.ts](proxy.ts) with the same rate-limit + CSP + security-headers logic (function `proxy` in place of `middleware`). See <https://nextjs.org/docs/messages/middleware-to-proxy>.

### Operational Runbook

**Backup / restore (Firestore)**

```bash
# One-off export to a Cloud Storage bucket (schedule via Cloud Scheduler for automated backups)
gcloud firestore export gs://your-project-id-backups/$(date +%Y-%m-%d)

# Restore
gcloud firestore import gs://your-project-id-backups/2026-07-22
```

**Backup / restore (Firebase Storage)**

```bash
gsutil -m rsync -r gs://your-project-id.firebasestorage.app gs://your-project-id-backups/storage-$(date +%Y-%m-%d)
```

**Rotating a Firebase Admin service account**

1. Google Cloud Console → IAM & Admin → Service Accounts → create a new key.
2. Update `FIREBASE_SERVICE_ACCOUNT` (or the split `FIREBASE_*` vars) in Vercel → Project Settings → Environment Variables.
3. Redeploy. Delete the old key from Google Cloud Console.

**Rotating the Gemini API key**

1. Google AI Studio → API Keys → create a new key.
2. Update `GEMINI_API_KEY` in Vercel.
3. Redeploy. Revoke the old key.

**Uptime monitoring**

Point any HTTP monitor (UptimeRobot, BetterStack, Pingdom, Google Cloud Monitoring) at `https://<your-domain>/api/health`. Expect HTTP 200 with `{"status":"ok"}` in ≤ 500 ms. If it returns 429, the rate limiter tripped — lower the monitor cadence to < 20 requests/minute per source IP.

**Upgrading dependencies (annual cadence recommended)**

```bash
nvm use
npm outdated
npm update            # respects semver ranges in package.json
npm run build         # smoke-check
git diff package-lock.json
```

Major bumps (Next.js, Firebase, React) require explicit review — upgrade one at a time and re-run the build.

### 2026-07-22 — Dead-Code Cleanup Summary

Removed only items with zero remaining references anywhere in the codebase.

**Files deleted (5 default create-next-app assets):**

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

**Dependencies removed from [package.json](package.json) (3):**

- `next-pwa` — not imported anywhere; PWA is hand-rolled via [public/sw.js](public/sw.js).
- `html2pdf.js` — not imported anywhere; PDF export uses `jspdf` only.
- `react-swipeable` — not imported anywhere.

**Code elements removed:** none (no unused classes, interfaces, methods, properties, or private fields could be proven unused with 100% certainty).

Run `npm install` to regenerate `package-lock.json`.
