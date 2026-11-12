# Petal & Prose — Testing & Performance Release Report

This report documents automated verification checks, security & privacy regression coverage, production build metrics, and measured desktop/mobile performance telemetry for the Petal & Prose digital bouquet platform (`/Users/vaibhavborkar/mydigibouquet.com`).

---

## 1. Release Verification Summary

| Suite / Gate | Scope | Outcome | Measured Result |
| --- | --- | --- | --- |
| TypeScript (`npm run typecheck`) | Full workspace (`strict` mode via `tsc --noEmit`) | Passed | Exit `0` (zero errors) |
| Unit & Engine Suite (`npm test`) | Vitest (`src/engine/__tests__/engine.test.ts`) | Passed | `17 / 17` tests (`4.17s`) |
| Production Build (`npm run build`) | Next.js App Router & static page generation | Passed | Exit `0`, compiled in `9.8s`, `53 / 53` static pages generated |
| Schema Migration (`npx drizzle-kit generate`) | Drizzle Kit SQLite/libSQL schema DDL | Passed | Generated `drizzle/0000_lame_vance_astro.sql` (`5` tables + `idx_projects_workspace` index) |
| Hot Database Backup (`node scripts/db-backup.mjs`) | Live SQLite backup & integrity verification | Passed | `401,408` bytes (`0600` permissions), `PRAGMA integrity_check=ok` |
| End-to-End Browser Suite (`npx playwright test --reporter=list`) | Full Playwright functional, security, analytics & telemetry specs | Passed | `10 / 10` scenarios (`1.6m`) |

---

## 2. Production Build Bundle Footprint

Observed from `npm run build` output on the release candidate:

- **Static Generation:** `53 / 53` prerendered/SSG pages completed cleanly.
- **First Load JS (Homepage `/`):** `124 kB`
- **First Load JS (Blog `/blog`):** `108 kB`
- **First Load JS (Studio `/studio`):** `249 kB`
- **Static Botanical Asset Footprint (`public/assets/v1/`):** `3.7 MB` total on disk (`flowers/` `1.7 MB`, `vessels/` `744 KB`, `ribbons/` `1.3 MB`) across `40` botanical SKUs.

---

## 3. End-to-End & Security Verification Coverage

The Playwright release suite (`npx playwright test --reporter=list`, `10 / 10` passed) exercised the production-compiled application end to end:

1. **Core Studio & Bouquet Creation Workflow:** Selecting flowers and greenery, wrapping/ribbon styling, arranging on the canvas, personalizing card copy, publishing share links (`/b/[slug]`), and high-resolution raster export.
2. **Media & Voice Attachments:** Image/audio upload validation, retrieval via `/api/media/[id]` with scoped headers (`Cache-Control: private, max-age=31536000, immutable`, `X-Robots-Tag: noindex, nofollow`), and recipient unboxing playback.
3. **API Hardening & Security Headers (Test 9):**
   - Cross-origin CSRF protection via `assertSameOrigin` returning `HTTP 403`.
   - Rate limiting via `checkRateLimit` (HMAC-hashed IP in-memory sliding window) returning `HTTP 429` with `Retry-After`.
   - Sanitized HTTP `500` error responses across mutating API routes.
   - Live production response CSP header verification (dropping `'unsafe-eval'` in production, allowing `worker-src 'self' blob:` and `media-src 'self' blob: data:`).
4. **Privacy-Respecting First-Party Analytics (Test 9):**
   - Verified `/api/analytics` honors `DNT: 1` and `Sec-GPC: 1` headers by skipping aggregate persistence cleanly (`HTTP 202`).
5. **Privacy-Scoped Indexing & SEO Routes:**
   - Public showcase filtering (`isPublicShowcase`), recipient name redaction (`hideNamesInPreview`), private `/api/og/[slug]` response privacy (`Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`), `robots.ts`, `sitemap.ts`, canonical metadata, and `/studio` parameter `noindex` handling.

---

## 4. Measured Performance Telemetry (Desktop & Mobile)

Measured during the Playwright telemetry pass (`PERF_METRICS_JSON`) against the running Next.js server:

| Metric | Desktop (`1280x800`) | Mobile (`390x844`) |
| --- | --- | --- |
| Homepage Full Load (`homeLoadMs`) | `297 ms` | `147 ms` |
| DOMContentLoaded (`dclMs`) | `70 ms` | `18 ms` |
| First Contentful Paint (`fcpMs`) | `96 ms` | `100 ms` |
| Cumulative Layout Shift (`cls`) | `0` | `0` |
| Flower/Asset WebP Requests (`webpCount`) | `14` | `13` |
| Max WebP Fetch Latency (`maxWebpMs`) | `87 ms` | `4 ms` |
| Transferred JS Payload (`jsKb`) | `125 KB` | `149 KB` |
| Studio Interactive Ready (`studioReadyMs`) | `484 ms` | `368 ms` |
| High-Resolution PNG Export (`exportMs`) | `825 ms` | `0 ms` *(not triggered in mobile pass)* |
| Recipient Unboxing Load (`unboxMs`) | `179 ms` | `188 ms` |

### Key Rendering Optimization Applied
- Added module-level `SHARED_BROWSER_IMAGE_CACHE` and pre-composition `await img.decode()` inside `createBrowserAssetStore()` (`src/engine/canvas-renderer.ts`), eliminating duplicate flower/vessel/ribbon network fetches across repeated homepage/occasion/gallery canvases and Step 5 PNG/JPG exports.

---

## 5. Known Scope Boundaries & Operational Notes

- **Playwright Sandbox Execution:** Binding a local HTTP server port for Playwright required `BypassSandbox: true` in this environment.
- **Gemini AI Florist Fallback:** No live `GEMINI_API_KEY` was configured during test runs; `src/engine/ai-florist.ts` executed its deterministic local floral composition engine (live Gemini path remains guarded by a `3.5s` `AbortController` timeout and schema validation fallback).
- **Rate Limiting Topology:** `checkRateLimit` uses an in-memory sliding window per Node instance; horizontal multi-region serverless deployments should pair it with edge WAF / distributed Redis rate limiting.
- **External Production Tasks Pending:** Live hosting deployment, TLS termination / `ENABLE_HSTS=true` activation, managed remote Turso (`libsql://...`) provisioning, and Google Search Console sitemap submission are documented in [`docs/deployment-guide.md`](./deployment-guide.md) and [`docs/seo-launch-checklist.md`](./seo-launch-checklist.md) and require live infrastructure credentials.

