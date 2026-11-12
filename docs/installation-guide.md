# Installation Guide — Petal & Prose

## 1. Prerequisites

| Dependency | Verified Version / Tool | Notes |
|---|---|---|
| **Node.js** | `v26.13.0` (LTS `>= 20.x` supported) | Runs Next.js App Router, Sharp, `@napi-rs/canvas`, Vitest, and Playwright |
| **npm** | `11.20.0` (bundled with Node) | Lockfile `package-lock.json` present |
| **SQLite CLI** | `sqlite3` (`/usr/bin/sqlite3`) | Used locally by `scripts/db-backup.mjs` for consistent `.backup` snapshots and restore checks |
| **Playwright Chromium** | `@playwright/test` (`1.56.1`) | Needed only for end-to-end browser verification |

---

## 2. Clean Installation Steps

1. **Install dependencies:**
   ```bash
   npm ci
   ```
2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` if pointing to a remote Turso instance or enabling optional Gemini enhancement.
3. **Verify / rebuild compiled botanical assets (optional — `public/assets/v1/` is pre-compiled):**
   ```bash
   npm run build:assets
   ```
   Generates 3-LOD WebP textures (`thumb`, `studio`, `export`), vessels, wraps, ribbon bows, and `src/generated/catalog-manifest.ts` (`40` SKUs, total `~3.7 MB`).
4. **Generate or verify Drizzle database migrations:**
   ```bash
   npm run db:generate
   ```
   Local tables and seeded editorial showcase bouquets (`sample-*`) also initialize idempotently on first request via [`ensureDbReady`](file:///Users/vaibhavborkar/mydigibouquet.com/src/db/index.ts#L31).

---

## 3. Running Locally

### Development Mode
```bash
npm run dev
```
Starts Next.js dev server on `http://localhost:3000`.

### Production Build & Local Serving
```bash
npm run build
npm run start
```
Binds port `3000` cleanly with production `Content-Security-Policy` (no `'unsafe-eval'`).

---

## 4. Running Automated Checks
```bash
npm run typecheck
npm test
npx playwright test --reporter=list
```

