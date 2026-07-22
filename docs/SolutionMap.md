# Solution Map

**Scan Date:** 2026-07-22 (long-term stability audit)

## Solution Overview

- **Number of projects:** 1 (single Next.js App Router application)
- **Number of APIs:** 1 project surfaces 3 route handlers — [app/api/session/route.ts](../app/api/session/route.ts), [app/api/process-song/route.ts](../app/api/process-song/route.ts), and [app/api/health/route.ts](../app/api/health/route.ts) — plus **~20 server actions** in [app/actions/dbActions.ts](../app/actions/dbActions.ts)
- **Number of class libraries:** 0 (internal library code lives under [lib/](../lib/) as first-party modules, not a separate package)
- **Number of test projects:** 0 (no test framework wired in — `package.json` has no `test` script and no `jest`/`vitest`/`playwright` dependency)

**Runtime surface:** ~50 TypeScript files (`.ts` / `.tsx`), 1 edge middleware, 1 hand-rolled service worker, 1 web app manifest. After the 2026-07-22 cleanup, [public/](../public/) contains only [public/manifest.json](../public/manifest.json) and [public/sw.js](../public/sw.js).

---

## Project Inventory

### `icba-directory` (Next.js App Router)

**Purpose:** Web + PWA application for a church congregation to manage members, a bilingual AI-processed songbook, meetings, prayer points, and an emergency blood registry. Serves public marketing pages and a role-gated member/admin area.

**Type:** Next.js 16 application (App Router, TypeScript, React 19.2). Deployed as serverless functions + edge middleware (Vercel-compatible).

**Runtime dependencies (from [package.json](../package.json)):**

| Package | Version | Used For |
| :--- | :--- | :--- |
| `next` | ^16.2.11 | Framework |
| `react` / `react-dom` | 19.2.3 | UI |
| `firebase` | ^12.9.0 | Client SDK — Auth, Firestore, Storage |
| `firebase-admin` | ^14.2.0 | Server SDK — session verification, privileged writes |
| `@react-google-maps/api` | ^2.20.8 | Primary map picker |
| `react-leaflet` / `leaflet` | ^5.0.0 / ^1.9.4 | Fallback map picker (OpenStreetMap) |
| `framer-motion` | ^12.34.3 | UI animations |
| `lucide-react` | ^0.575.0 | Icons |
| `jspdf` | ^4.2.0 | PDF export of directory / songbook |
| `xlsx` | ^0.18.5 | CSV bulk import parsing |
| `react-easy-crop` | ^5.5.6 | Family photo cropping |
| `jose` (override) | ^4.15.5 | Locked to satisfy `firebase-admin` peer requirements |

**Dev dependencies:** `typescript ^5`, `eslint ^9`, `eslint-config-next ^16.2.11`, `tailwindcss ^4`, `@tailwindcss/postcss ^4`, `@types/*`.

**Referenced projects:** none.

**Key folders:**

- [app/](../app/) — routes, layouts, pages, server actions, API handlers
- [app/actions/](../app/actions/) — `'use server'` server actions ([dbActions.ts](../app/actions/dbActions.ts))
- [app/api/](../app/api/) — route handlers (`session`, `process-song`)
- [components/](../components/) — reusable client components
- [lib/](../lib/) — Firebase wiring, auth-session helpers, rate limiter, logger, image utils, auth context
- [data/](../data/) — static content ([beliefsContent.ts](../data/beliefsContent.ts))
- [public/](../public/) — static assets, PWA manifest, service worker

**Important components:**

| File | Role |
| :--- | :--- |
| [proxy.ts](../proxy.ts) | Edge proxy (formerly `middleware.ts`) — CSP, security headers, IP rate limit |
| [lib/firebase.ts](../lib/firebase.ts) | Client Firebase SDK singleton (`auth`, `db`, `storage`) with persistent multi-tab cache |
| [lib/firebase-admin.ts](../lib/firebase-admin.ts) | Lazy Admin SDK init supporting `FIREBASE_SERVICE_ACCOUNT` JSON, split env vars, or ADC |
| [lib/auth-session.ts](../lib/auth-session.ts) | Session cookie verification + `requireUser` / `requireAdmin` |
| [lib/AuthContext.tsx](../lib/AuthContext.tsx) | Client `AuthProvider` and `useAuth()` |
| [lib/rate-limit.ts](../lib/rate-limit.ts) | In-memory IP token bucket (20 req/min, skips RSC/prefetch) |
| [lib/logger.ts](../lib/logger.ts) | `logActivity()` — client-side `activity_logs` writer |
| [lib/imageUtils.ts](../lib/imageUtils.ts) | Image resize/crop helpers |
| [app/actions/dbActions.ts](../app/actions/dbActions.ts) | All server-side writes for members, users, meetings, prayer points, songs |
| [app/api/session/route.ts](../app/api/session/route.ts) | Mint / clear the httpOnly `session` cookie |
| [app/api/process-song/route.ts](../app/api/process-song/route.ts) | Gemini 2.5 Flash song ingestion (60s max duration) |
| [app/api/health/route.ts](../app/api/health/route.ts) | Liveness probe for uptime monitors (`GET /api/health`) |
| [components/MapPicker.tsx](../components/MapPicker.tsx) / [components/LocationPicker.tsx](../components/LocationPicker.tsx) | Google Maps + Leaflet fallback address selector |
| [components/DirectoryCard.tsx](../components/DirectoryCard.tsx) | Directory list item / detail card |
| [components/TopBar.tsx](../components/TopBar.tsx) / [components/PublicNavbar.tsx](../components/PublicNavbar.tsx) | Global navigation |
| [components/InstallPrompt.tsx](../components/InstallPrompt.tsx) | PWA install CTA |

---

## Request Flow Mapping

### Read flow (directory browse)

```
Browser (React client component)
  → lib/firebase.ts (client SDK)
  → Firestore (with Security Rules enforcement)
  → onSnapshot updates React state
```

Example: [app/directory/page.tsx](../app/directory/page.tsx) → `db` → `members` collection.

### Write flow (family submission)

```
Client form (app/add-family/page.tsx or app/edit-family/[id]/page.tsx)
  → Server Action (app/actions/dbActions.ts :: createFamilySubmission / updateFamilySubmission)
    → requireUser() reads session cookie via getAdminAuth().verifySessionCookie
    → getAdminDb().collection('members').add / .update
    → revalidatePath('/directory'), revalidatePath('/dashboard')
  → Client receives { success: true, id }
```

### Admin approval flow

```
Admin visits /approvals (app/approvals/page.tsx)
  → onSnapshot streams pending members / pending users
  → Admin clicks Approve
    → Server Action (approveFamilyCreation / approveFamilyEdit / approveUserAccess)
      → requireAdmin()
      → getAdminDb() mutation
      → activity_logs.add({ userName, userEmail, action, details, timestamp })
      → revalidatePath('/approvals')
```

### Authentication flow

```
app/login/page.tsx
  → firebase/auth signInWithEmailAndPassword (client SDK)
  → user.getIdToken()
  → POST /api/session { idToken }
    → getAdminAuth().createSessionCookie(idToken, 5 days)
    → Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax
  → Client navigates; AuthContext onSnapshot picks up users/{uid}
  → Routing per role: pending → /waiting-room, approved → /dashboard, admin → /admin
```

### AI song ingestion flow

```
app/songbook/add/page.tsx (image upload or pasted text)
  → POST /api/process-song
    → rateLimit(req) (429 on abuse)
    → getSessionUser() (401 if unauthenticated)
    → Fetch images → base64 → Gemini 2.5 Flash with strict JSON prompt
    → Parse { title, language, originalAuthor, lyrics, transliterationEnglish,
              transliterationMalayalam, meaningEnglish, meaningMalayalam }
  → Client shows preview → Server Action createSong
    → songs.orderBy('songNumber', 'desc').limit(1) to assign next number
    → revalidatePath('/songbook')
```

### Edge / security flow (every request)

```
Any HTTP request
  → proxy.ts (edge runtime)
    → rateLimit(request) — skipped for RSC / prefetch
    → Set CSP, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy
  → Next.js route resolution
```

### Liveness probe

```
Uptime monitor
  → GET /api/health (app/api/health/route.ts, runtime='nodejs', dynamic='force-dynamic')
  → 200 { status: 'ok', timestamp, commit, region }
```

---

## Dependency Graph

Single project; the graph is layer-internal:

```
                          ┌────────────────────────┐
                          │   proxy.ts (edge)      │
                          └───────────┬────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │      lib/rate-limit    │
                          └────────────────────────┘

  ┌────────────────────┐        ┌────────────────────────────┐
  │   components/*     │◄──────►│      app/**/page.tsx        │
  └─────────┬──────────┘        │        (client)             │
            │                   └──────────────┬──────────────┘
            │                                  │
            ▼                                  ▼
  ┌────────────────────┐        ┌────────────────────────────┐
  │  lib/AuthContext   │◄──────►│        lib/firebase         │
  │  lib/logger        │        │        (client SDK)         │
  │  lib/imageUtils    │        └──────────────┬──────────────┘
  └────────────────────┘                       │
                                               ▼
                                          Firestore / Auth / Storage
                                          (client-side, gated by
                                           Security Rules)

  ┌────────────────────┐        ┌────────────────────────────┐
  │  app/actions/*     │──────► │      lib/auth-session       │
  │  app/api/*         │        └──────────────┬──────────────┘
  │  (server)          │                       │
  └─────────┬──────────┘                       ▼
            │                       ┌────────────────────────┐
            │                       │    lib/firebase-admin  │
            ▼                       └──────────────┬─────────┘
       revalidatePath /                            │
       NextResponse                                ▼
                                             Firestore / Auth
                                             (server-side,
                                              privileged)
```

**Invariants:**

- `lib/` is a leaf — it never imports from `app/`, `components/`, or `data/`.
- `firebase-admin` appears only in `lib/firebase-admin.ts`, `lib/auth-session.ts`, `app/actions/**`, and `app/api/**` — never in client code.
- `firebase` (client SDK) appears in `lib/firebase.ts`, `lib/AuthContext.tsx`, `lib/logger.ts`, `components/**`, and `'use client'` pages — never in server actions or route handlers.
- No circular imports.
- `proxy.ts` stays edge-runtime clean — no Node-only APIs, no `firebase-admin`.

---

## Key Entry Points

- **Root layout:** [app/layout.tsx](../app/layout.tsx) — mounts `AuthProvider`, `TopBar`, `InstallPrompt`, and registers `/sw.js`.
- **Root page:** [app/page.tsx](../app/page.tsx) — public marketing homepage.
- **Edge proxy:** [proxy.ts](../proxy.ts) — runs on every non-static request (excluding `_next/static`, `_next/image`, `favicon.ico`, `manifest.json`). Renamed from `middleware.ts` on 2026-07-22.
- **Route handlers:**
  - [app/api/session/route.ts](../app/api/session/route.ts) — `POST` mint, `DELETE` clear.
  - [app/api/process-song/route.ts](../app/api/process-song/route.ts) — `POST` (`maxDuration = 60`).
  - [app/api/health/route.ts](../app/api/health/route.ts) — `GET` liveness probe.
- **Server actions:** every exported function in [app/actions/dbActions.ts](../app/actions/dbActions.ts) — `createFamilySubmission`, `updateFamilySubmission`, `approveUserAccess`, `rejectUserAccess`, `approveFamilyCreation`, `rejectFamilyCreation`, `approveFamilyEdit`, `rejectFamilyEdit`, `deleteUserAccount`, `upsertUserProfile`, `createMeeting`, `updateMeeting`, `deleteMeeting`, `createPrayerPoint`, `updatePrayerPoint`, `deletePrayerPoint`, `createSong`, (and any adjacent song update/delete helpers in the same file).
- **SEO generators:** [app/robots.ts](../app/robots.ts), [app/sitemap.ts](../app/sitemap.ts).
- **Service worker:** [public/sw.js](../public/sw.js), registered inline in `app/layout.tsx`.
- **Runtime pin:** [.nvmrc](../.nvmrc) + `engines.node` in [package.json](../package.json).
- **Env template:** [.env.example](../.env.example).
- **Hosted services / message consumers / job schedulers:** **none.** No cron, no background worker, no message queue.

---

## Business Modules

### Members / Directory

- Pages: [app/directory/page.tsx](../app/directory/page.tsx), [app/add-family/page.tsx](../app/add-family/page.tsx), [app/edit-family/[id]/page.tsx](../app/edit-family/%5Bid%5D/page.tsx), [app/bachelors/page.tsx](../app/bachelors/page.tsx), [app/blood-registry/page.tsx](../app/blood-registry/page.tsx)
- Components: [components/DirectoryCard.tsx](../components/DirectoryCard.tsx), [components/SubDirectory.tsx](../components/SubDirectory.tsx), [components/MapPicker.tsx](../components/MapPicker.tsx), [components/LocationPicker.tsx](../components/LocationPicker.tsx)
- Server actions: `createFamilySubmission`, `updateFamilySubmission`, `approveFamilyCreation`, `rejectFamilyCreation`, `approveFamilyEdit`, `rejectFamilyEdit`
- Firestore: `members` collection with `draftData`, `hasPendingEdit`, `isPendingCreation`, `submittedBy`, `createdAt`, `lastEdited`

### Songbook (AI-processed)

- Pages: [app/songbook/page.tsx](../app/songbook/page.tsx), [app/songbook/add/page.tsx](../app/songbook/add/page.tsx), [app/songbook/[id]/page.tsx](../app/songbook/%5Bid%5D/page.tsx), [app/songbook/[id]/edit/page.tsx](../app/songbook/%5Bid%5D/edit/page.tsx)
- API: [app/api/process-song/route.ts](../app/api/process-song/route.ts) (Gemini 2.5 Flash)
- Server actions: `createSong` (auto-incrementing `songNumber`) and adjacent update/delete
- Firestore: `songs` collection

### Users & Access Control

- Pages: [app/login/page.tsx](../app/login/page.tsx), [app/waiting-room/page.tsx](../app/waiting-room/page.tsx), [app/manage-users/page.tsx](../app/manage-users/page.tsx), [app/approvals/page.tsx](../app/approvals/page.tsx)
- API: [app/api/session/route.ts](../app/api/session/route.ts)
- Server actions: `approveUserAccess`, `rejectUserAccess`, `deleteUserAccount`, `upsertUserProfile`
- Firestore: `users` collection (`role ∈ { admin, approved, pending }`)

### Admin & Audit

- Pages: [app/admin/page.tsx](../app/admin/page.tsx), [app/activity-log/page.tsx](../app/activity-log/page.tsx)
- Firestore: `activity_logs` — append-only, admin-read
- Helpers: [lib/logger.ts](../lib/logger.ts) (client), inline writes inside server actions (server)

### Meetings & Prayer

- Pages: [app/meetings/page.tsx](../app/meetings/page.tsx), [app/prayer/page.tsx](../app/prayer/page.tsx)
- Server actions: `createMeeting` / `updateMeeting` / `deleteMeeting`, `createPrayerPoint` / `updatePrayerPoint` / `deletePrayerPoint`
- Firestore: `meetings`, `prayer_points`

### Public & Content

- Pages: [app/page.tsx](../app/page.tsx), [app/beliefs/page.tsx](../app/beliefs/page.tsx), [app/visit/page.tsx](../app/visit/page.tsx), [app/privacy/page.tsx](../app/privacy/page.tsx), [app/terms/page.tsx](../app/terms/page.tsx), [app/sunday-school/page.tsx](../app/sunday-school/page.tsx), [app/youth/page.tsx](../app/youth/page.tsx), [app/dashboard/beliefs/page.tsx](../app/dashboard/beliefs/page.tsx)
- Content: [data/beliefsContent.ts](../data/beliefsContent.ts)
- Components: [components/PublicNavbar.tsx](../components/PublicNavbar.tsx), [components/Footer.tsx](../components/Footer.tsx)

---

## External Integrations

| Integration | Type | Configured Via | Consumed By |
| :--- | :--- | :--- | :--- |
| Firebase Authentication | Auth provider | `NEXT_PUBLIC_FIREBASE_*` (client), `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` (server) | Client sign-in, session cookie minting |
| Cloud Firestore | Database (NoSQL, doc/collection) | Same as above | Client reads, Admin writes |
| Firebase Storage | Object storage | Same as above | Family photos, songbook images (with 5 MB / image-only rule) |
| Google Gemini 2.5 Flash | AI API | `GEMINI_API_KEY` (server-only) | [app/api/process-song/route.ts](../app/api/process-song/route.ts) |
| Google Maps JS + Places + Geocoding | Map / geocoding | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | [components/MapPicker.tsx](../components/MapPicker.tsx), [components/LocationPicker.tsx](../components/LocationPicker.tsx) |
| OpenStreetMap / Nominatim | Map fallback | None (public tile server) | `react-leaflet` fallback |
| PWA / Service Worker | Client runtime | [public/manifest.json](../public/manifest.json), [public/sw.js](../public/sw.js) | Registered in [app/layout.tsx](../app/layout.tsx) |

**Event buses, queues, background workers, authentication providers beyond Firebase, monitoring platforms:** none configured.

---

## Risks and Observations

1. **No automated tests.** [package.json](../package.json) declares no `test` script and no testing framework. Regressions rely entirely on manual QA. Recommend adding at minimum a Playwright smoke suite for the login → approval → directory flow and a Vitest suite for server-action guards.
2. **In-memory rate limiter.** [lib/rate-limit.ts](../lib/rate-limit.ts) uses a per-instance `Map`. On Vercel serverless / edge, buckets are not shared across instances, so the 20-req/min ceiling is soft. Move to Upstash Redis or Vercel KV if abuse-resistance becomes a requirement.
3. **Large page components.** [app/edit-family/[id]/page.tsx](../app/edit-family/%5Bid%5D/page.tsx) (`~573` lines to the default export) and [app/directory/page.tsx](../app/directory/page.tsx) (`~443` lines) are large single-file client components. Extraction of form sections and list virtualization would improve maintainability.
4. **Session cookie lifetime is 5 days** ([app/api/session/route.ts](../app/api/session/route.ts)) with no server-side revocation path. If a user is demoted, they retain access until the cookie expires or they sign out. Consider a `sessionVersion` field on `users/{uid}` compared inside `requireUser`.
5. **No CI/CD pipeline in the repo.** No `.github/workflows/*` exists. Deployment is assumed to be Vercel Git integration; formalize with a `preview → production` workflow and typecheck/lint gates.
6. **`activity_logs` is unbounded.** No TTL, retention policy, or archival. Costs and query latency will grow over time.
7. **Client SDK reads bypass server logging.** Since the browser reads Firestore directly, sensitive views (e.g., blood registry) are only audited on the client via `logActivity`, which a determined user can skip. If audit is required for compliance, route those reads through server actions.
8. **Loose typing on server-action payloads.** [app/actions/dbActions.ts](../app/actions/dbActions.ts) accepts `payload: any` / `formData: any`. Introducing Zod schemas would give runtime validation at the trust boundary without changing the write path.

**Circular dependencies:** none detected. **Tight coupling:** low — modules communicate through the `lib/` seams. **Missing tests:** entire suite. **Architectural concerns:** primarily the rate-limiter storage and session-revocation gaps noted above.

---

## Potential Cleanup Candidates (not removed)

Items below have plausible but not 100%-provable disuse. They were left in place per the strict deletion policy. Confirm with the maintainer before touching:

- **Route handler bodies vs. Server Actions.** Every server action in [app/actions/dbActions.ts](../app/actions/dbActions.ts) was checked for at least one static import; none were flagged as orphaned. If dynamic (`await import(...)`) callers exist elsewhere, static grep would miss them, so no action was taken.
- **`jose` override in [package.json](../package.json).** Retained because `firebase-admin` transitively requires it and the override pins a security-patched version. Do not drop without re-testing session verification.
- **`@types/leaflet` devDependency.** Retained because [components/MapPicker.tsx](../components/MapPicker.tsx) uses `leaflet` via `require('leaflet')` and imports `leaflet/dist/leaflet.css`; the types support editor tooling.
- **Commented-out code inside pages/components.** Not swept in this pass because distinguishing dead code from intentional TODO/documentation comments requires a case-by-case review. Candidate for a future dedicated pass.
- **Field-level dead code (unused props, private helpers) inside large pages** such as [app/edit-family/[id]/page.tsx](../app/edit-family/%5Bid%5D/page.tsx) and [app/directory/page.tsx](../app/directory/page.tsx). Static analysis coverage inside single 500+ line files is unreliable; recommend running `eslint --rule 'no-unused-vars: error'` as a follow-up.

## Mapping History

| Date | Action |
| :--- | :--- |
| 2026-07-22 | Repository scanned and SolutionMap generated |
| 2026-07-22 | Dead-code cleanup pass: removed 5 unused public SVG assets and 3 unused npm dependencies (`next-pwa`, `html2pdf.js`, `react-swipeable`). SolutionMap refreshed. |
| 2026-07-22 | Long-term stability audit: added `.nvmrc`, `.env.example`, `engines.node` pin, `/api/health` route; renamed `middleware.ts` → `proxy.ts` per Next.js 16 deprecation notice. |
