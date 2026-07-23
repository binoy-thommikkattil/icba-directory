# Repository Instructions

These are repository-specific instructions for GitHub Copilot working in the **ICBA Directory** codebase — a single Next.js 16 (App Router) + Firebase + Gemini application. Follow them to stay consistent with the existing architecture.

---

## Architecture Rules

Only these patterns are actually used. Do not introduce others without an explicit request.

- **Next.js App Router (single project)** — one Next.js app; no monorepo, no separate API project, no class libraries.
- **Server Actions for writes** — all authoritative mutations live in [app/actions/dbActions.ts](../app/actions/dbActions.ts). Do not create ad-hoc API routes for CRUD when a server action will do.
- **Two-plane trust model:**
  - Client plane uses the Firebase **client SDK** ([lib/firebase.ts](../lib/firebase.ts)) and reads are gated by Firestore Security Rules.
  - Server plane uses the Firebase **Admin SDK** ([lib/firebase-admin.ts](../lib/firebase-admin.ts)) and is gated by session-cookie verification in [lib/auth-session.ts](../lib/auth-session.ts).
- **Dual-path server auth** — server code calls `requireUser(token?)` / `requireAdmin(token?)` from [lib/auth-session.ts](../lib/auth-session.ts). Preferred: the client passes `await auth.currentUser?.getIdToken()` as the last argument to the server action (or as `Authorization: Bearer <token>` for route handlers). Fallback: the httpOnly `session` cookie minted at [app/api/session/route.ts](../app/api/session/route.ts). Both paths use `checkRevoked=true`, so deleted users are rejected immediately. Never read cookies directly outside `lib/auth-session.ts` and route handlers.
- **Reactive context** — global auth state comes from [lib/AuthContext.tsx](../lib/AuthContext.tsx). Client pages consume `useAuth()`; they do not re-subscribe to `onAuthStateChanged` themselves.
- **Approval / draft-diff workflow** — non-admin edits to `members/{id}` are staged into `draftData` with `hasPendingEdit: true` (or `isPendingCreation: true` for new records) and merged by an admin on `/approvals`.
- **RBAC via role field** — `users/{uid}.role ∈ { 'admin', 'approved', 'pending' }`. Rules also enforce these on the client SDK side.
- **Edge proxy for CSP + rate limiting** — [proxy.ts](../proxy.ts) (renamed from `middleware.ts` per Next.js 16 deprecation) sets a strict CSP and delegates IP throttling to [lib/rate-limit.ts](../lib/rate-limit.ts).
- **Liveness probe** — [app/api/health/route.ts](../app/api/health/route.ts) exposes `GET /api/health` for uptime monitors. It is `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, and never reads secrets.
- **PWA** — hand-rolled service worker at [public/sw.js](../public/sw.js) registered in the root layout.

Patterns explicitly **not** used: CQRS, MediatR/mediator library, generic repository/unit-of-work abstractions, dependency-injection containers, ORMs, message queues, microservices.

---

## Project Responsibilities

There is only one project. The rules below cover its internal layers.

### `app/` (routes, pages, server actions, API handlers)

- **Responsibility:** All routing surfaces — pages (`'use client'` when interactive), server actions (`'use server'`), and route handlers.
- **Allowed dependencies:** `components/`, `lib/`, `data/`, third-party UI, Firebase client SDK (only in `'use client'` files), Firebase Admin SDK (only in `'use server'` or route handlers).
- **Forbidden:** Importing `firebase-admin` into any file that is (or is reachable from) a client component. Reading `cookies()` / `headers()` outside of `lib/auth-session.ts` and route handlers.

### `components/`

- **Responsibility:** Reusable presentational + interactive React components (`DirectoryCard`, `MapPicker`, `TopBar`, etc.).
- **Allowed dependencies:** `lib/AuthContext`, `lib/firebase` (client SDK only), `lib/imageUtils`, third-party UI libraries.
- **Forbidden:** `firebase-admin`, `next/headers`, server-only APIs, direct imports of server actions' internals (call them as functions, don't re-implement them).

### `lib/`

- **Responsibility:** Cross-cutting infrastructure — Firebase wiring, auth helpers, rate limiting, logging, image utilities.
- **Allowed dependencies:** External packages, other `lib/` modules.
- **Forbidden:** Importing from `app/`, `components/`, or `data/`. `lib/` must remain a leaf layer.

### `data/`

- **Responsibility:** Static content (currently doctrinal text in [data/beliefsContent.ts](../data/beliefsContent.ts)).
- **Allowed dependencies:** None — pure data modules.
- **Forbidden:** Any runtime logic, Firebase imports, or React imports.

### `proxy.ts`

- **Responsibility:** Edge-runtime security headers (CSP, Referrer-Policy, X-Frame-Options, Permissions-Policy) and rate limiting.
- **Allowed dependencies:** `next/server`, `lib/rate-limit`.
- **Forbidden:** Firebase Admin SDK, Node-only APIs — this runs on the edge runtime.
- **Naming:** the exported function must be `proxy` (not `middleware`). Do not re-introduce a `middleware.ts` file.

### `public/`

- **Responsibility:** Static assets, PWA manifest, service worker.
- **Forbidden:** Do not import `public/` files into TypeScript — reference them by URL.

---

## Coding Guidance

### Naming conventions

- **Files:** kebab-case for route folders (`add-family`, `blood-registry`, `edit-family/[id]`); PascalCase for React component files (`DirectoryCard.tsx`, `MapPicker.tsx`); camelCase for lib modules (`auth-session.ts`, `firebase-admin.ts`, `dbActions.ts`).
- **Components:** PascalCase (`DirectoryCard`, `PublicNavbar`).
- **Server actions:** camelCase verbs — `createFamilySubmission`, `approveFamilyEdit`, `deleteUserAccount`.
- **Firestore collections:** snake_case plural (`activity_logs`, `prayer_points`) or plain plural (`users`, `members`, `songs`, `notices`, `meetings`).
- **Fields:** camelCase (`isPendingCreation`, `hasPendingEdit`, `draftData`, `songNumber`, `submittedBy`).
- **Env vars:** `NEXT_PUBLIC_*` for browser-safe values; unprefixed (`GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT`) for server-only secrets. When adding a new env var, document it in [.env.example](../.env.example) at the same time.

### Path aliases

Always use the `@/` alias configured in [tsconfig.json](../tsconfig.json) — e.g. `import { db } from '@/lib/firebase'`. Do not use deep relative paths like `../../../lib/firebase`.

### Dependency injection

The codebase does **not** use a DI container. Wire dependencies by direct import. Firebase Admin is lazily initialized in [lib/firebase-admin.ts](../lib/firebase-admin.ts); call `getAdminAuth()` / `getAdminDb()` instead of caching the app yourself.

### Client vs. server

- Every interactive page opens with `'use client'`. Only add it when the file actually uses hooks, state, or event handlers.
- Every server-write module opens with `'use server'` (see [app/actions/dbActions.ts](../app/actions/dbActions.ts)).
- Never import `firebase-admin` into a client component. Never import `firebase/auth`/`firebase/firestore` client SDK into a server action.

### Data access

- **Reads from client components:** use the Firebase client SDK (`onSnapshot`, `getDocs`) directly with `db` from `@/lib/firebase`. Security Rules do the enforcement.
- **Writes:** call a server action from [app/actions/dbActions.ts](../app/actions/dbActions.ts). If a needed action does not exist, add one there — do not create parallel write paths in components.
- **Every new server action must** accept an optional trailing `token?: string | null` parameter, start with `await requireUser(token)` or `await requireAdmin(token)`, then call `getAdminDb()`, then `revalidatePath(...)` for any pages that render the mutated data. Every client caller must obtain the token via `await auth.currentUser?.getIdToken()` and pass it as the last positional argument.
- **Timestamps:** use `new Date().toISOString()` — the codebase stores ISO strings, not Firestore `Timestamp` objects.
- **Audit trail:** admin-only mutations append a document to `activity_logs` with `{ userName, userEmail, action, details, timestamp }`. Preserve this convention.

### Logging

- Client-side user actions go through `logActivity(userProfile, action, details)` in [lib/logger.ts](../lib/logger.ts), which writes to `activity_logs` via the client SDK.
- Server-side admin actions write to `activity_logs` inline within the server action (see `approveUserAccess`, etc.).
- Use `console.error` (not `console.log`) for unexpected failures; do not add a new logging framework.

### Error handling

- Server actions return `{ success: true, ... }` on success and let thrown errors propagate; callers surface a toast/message.
- `requireUser` / `requireAdmin` throw `'Unauthorized'` / `'Forbidden'` — do not swallow these.
- Route handlers return `NextResponse.json({ error }, { status })` with 400 / 401 / 429 / 500 as appropriate. See [app/api/session/route.ts](../app/api/session/route.ts) and [app/api/process-song/route.ts](../app/api/process-song/route.ts) for the pattern.
- Always run `rateLimit(req)` at the top of externally-callable route handlers.

### Security

- Never log secrets or session cookies.
- The CSP in [proxy.ts](../proxy.ts) is strict; if you add a new script host, update the CSP explicitly.
- Never widen Firestore/Storage rules from the README defaults without discussing it.
- Never move `GEMINI_API_KEY` (or any unprefixed secret) into a `NEXT_PUBLIC_*` variable.

### Styling

- Tailwind CSS v4 with the `@tailwindcss/postcss` plugin (see [postcss.config.mjs](../postcss.config.mjs) and [app/globals.css](../app/globals.css)). Use utility classes; do not add a CSS-in-JS library.
- Follow the existing mobile-first, single-column layouts. Icons come from `lucide-react`.

### Runtime & builds

- **Node runtime** is pinned via [.nvmrc](../.nvmrc) (`20.19.0`) and `engines.node: >=20.0.0 <25.0.0` in [package.json](../package.json). Do not bump these without explicit approval.
- **Installs** must use `npm ci` in CI/CD so builds are reproduced exactly from `package-lock.json`. Use `npm install` only when intentionally changing dependencies.
- **Do not re-introduce** `next-pwa`, `html2pdf.js`, or `react-swipeable` — they were removed in the 2026-07-22 cleanup and their functionality is either hand-rolled or covered by `jspdf`.

### Testing

There is currently **no test framework** configured in this repo (no `jest`, `vitest`, `playwright`, or `test` scripts in [package.json](../package.json)). If you introduce tests, propose the framework choice explicitly before wiring it in.

---

## AI Analysis Instructions

When Copilot analyzes or generates code in this repo:

1. **Follow existing patterns.** New writes go through a server action in [app/actions/dbActions.ts](../app/actions/dbActions.ts); new secured endpoints follow the shape of [app/api/process-song/route.ts](../app/api/process-song/route.ts) (rate limit → session check → work → JSON response).
2. **Reuse existing abstractions before creating new ones.** Use `getAdminAuth`, `getAdminDb`, `requireUser`, `requireAdmin`, `useAuth`, `logActivity`, `rateLimit`, `MapPicker`, `DirectoryCard` — don't reinvent them.
3. **Respect dependency boundaries.** `lib/` is a leaf. Client components never import `firebase-admin`. Server actions never import `AuthContext`. `middleware.ts` stays edge-runtime clean.
4. **Search for existing implementations first.** Before adding a helper, grep the workspace — collection names, role checks, activity logging, and image handling already exist.
5. **Prefer consistency over introducing new frameworks.** Do not add state managers, DI containers, ORMs, testing libraries, or alternate styling systems without an explicit request.
6. **Preserve the RBAC contract.** Any new server action must gate on `requireUser` or `requireAdmin`; any new admin-only mutation must append to `activity_logs`; any new user-visible change must `revalidatePath` the affected routes.
7. **Preserve provenance.** Store `submittedBy`, `createdBy`, `updatedBy`, `lastEdited` fields on mutations, matching the existing shape.

---

## Generated Metadata

- Last Repository Scan: 2026-07-23
- Last Instruction Refresh: 2026-07-23
- Last Dead-Code Cleanup: 2026-07-22 — removed `next-pwa`, `html2pdf.js`, `react-swipeable` from [package.json](../package.json) and the 5 default create-next-app SVGs from `public/`. No code elements deleted.
- Last Long-Term Stability Audit: 2026-07-22 — added `.nvmrc`, `.env.example`, `engines.node` pin, `GET /api/health` liveness probe; renamed `middleware.ts` → `proxy.ts` per Next.js 16 deprecation notice.
- Last Auth Hardening Pass: 2026-07-23 — strict `FIREBASE_PRIVATE_KEY` validation in [lib/firebase-admin.ts](../lib/firebase-admin.ts); token-based `requireUser(token?)` / `requireAdmin(token?)` with `verifyIdToken(token, true)`; every server action now takes an optional trailing `token` arg; `/api/process-song` accepts `Authorization: Bearer`; `deleteUserAccount` revokes refresh tokens + deletes Firebase Auth user; `AuthContext` auto-kick clears the httpOnly `session` cookie.
