# Phased Implementation Roadmap (`implementation-roadmap.md`)

**Version:** `1.1 (Peer-Reviewed & Verification-Locked — Milestones 0 through 6)`  
**Methodology:** Every milestone concludes with concrete empirical checks (Node 26 native binding verification, unit/API tests, Playwright cross-viewport checks, `axe-core`, and Lighthouse/CWV gates) and updates `STATE.md` / `docs/TASK_TRACKER.md`.

---

## Milestone 0: Foundation, Toolchain Smoke Test & Database Schema
**Goal:** Establish a strict TypeScript Next.js codebase, verify native binaries (`sharp`, `@napi-rs/canvas`) cleanly under **`Node v26.13.0`**, lock CSP/security headers, and initialize LibSQL + Drizzle migrations.
- **Work Breakdown:**
  1. Initialize `package.json`, `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`), Tailwind tokens (Light Atelier + `--dark-*` including `--dark-border #737970`), and dev test tools (`vitest`, `@playwright/test`, `@axe-core/playwright`, `sharp`).
  2. Configure `src/lib/fonts-base.ts` (`Cormorant Garamond` `400/500/600` normal+italic, `Plus Jakarta Sans` `400/500/600`) for root layout, plus leaf font modules `src/lib/fonts-script.ts` (`Alex Brush`) & `src/lib/fonts-literary.ts` (`Lora` normal+italic) strictly for studio/recipient routes + local `.woff2` (regular + italic) copies on disk for `@napi-rs/canvas`.
  3. Author `src/engine/types.ts`, `src/engine/validation.ts` (`BouquetSceneV1` enums, 8 canonical `OccasionSlug`s, `Intl.Segmenter` + UTF-8 byte limits, Bidi strip, `Vessel` matrix), and `src/lib/security.ts` (`getTrustedClientIp`, `HMAC-SHA256` IP pepper, `Origin` check, `timingSafeEqual`, async `crypto.scrypt`).
  4. Author `src/db/schema.ts` (8 tables matching `database-schema.md` v1.1), initialize `src/db/index.ts` executing `PRAGMA foreign_keys = ON` per connection (`file:./data/mydigibouquet.db`), generate Drizzle migrations, and run idempotent `src/db/seed.ts`.
  5. Configure `next.config.ts` strict CSP (`img-src 'self' data: blob:`, `media-src 'self' blob:`, zero ad scripts) + `GET /api/health` (`runtime = "nodejs"`).
- **Verification Gate:** `npx tsc --noEmit`; empirical **`Node v26.13.0` native smoke test** loading `sharp` (JPEG/WebP re-encode + buffer metadata) AND `@napi-rs/canvas` (rendering text using local `.woff2` file); `sqlite3 ./data/mydigibouquet.db` asserting `28` `flower_assets`, `6` `card_templates`, FK pragma `1`; `GET /api/health` returning HTTP `200` without write mutation.

---

## Milestone 1: Botanical Asset Pipeline & Crawl-First SEO Pages
**Goal:** Build `scripts/build-assets.mjs` (`sharp` only — zero `ffmpeg`/`magick`), generate crisp SVG/PNG-master botanical/vessel/stationery/editorial artwork + verify pre-encoded `.m4a`/`.mp3` audio fixtures, and ship SSR SEO pages (`/` -> legal -> `404`).
- **Work Breakdown:**
  1. Implement `scripts/build-assets.mjs` transforming PNG masters (`assets-master/`) -> decontaminated 3-LOD WebPs (`thumb <15 KB`, `studio <60 KB`, `export <=1400px`) + `160px` `hitmask.json` + typed `src/generated/catalog-manifest.ts` (with compiled vector clip polygons) + copy/size-check pre-encoded `.m4a`/`.mp3` audio (`<600 KB`, skipping `bowStyleId === "none"`, `bare-stems`, `audioTrackId === "silent"`).
     - *CI / Dev Fixture Plan:* Craft clean realistic studio PNG source artwork / vector-layered raster masters in `assets-master/` (including curated `editorial/*` Hero & species spotlights) so the entire catalog compiles deterministically in CI/local runs with zero external API blockers.
  2. Implement `GET /api/catalog` & `GET /api/templates` (`runtime = "nodejs"`, `X-Robots-Tag: noindex`).
  3. Build shared navigation, footer, custom `1.5px` SVG `AtelierIcons`, `AtelierButton`, `ModalSheet`, `ToastBanner`, `SkeletonCard`.
  4. Build SSR Homepage (`/`) + Pages 8–10: `/occasions`, 8 `/occasions/[slug]`, `/flowers`, 12 `/flowers/[slug]` (`#color` anchors), `/gallery`, `/about`, `/privacy`, `/terms`, `src/app/robots.ts`, `src/app/sitemap.ts` (`ImageObject`), and tailored HTTP `404`s.
- **Verification Gate:** Assert all generated files match `<= size` limits; verify `/` bundle inspector shows **0 Konva / 0 `Alex Brush` / 0 `Lora`** chunks and First-Load JS `< 95 KB` gz; verify `GET /robots.txt`, `GET /sitemap.xml`, `HTTP 404` on `/occasions/invalid-x` & `/flowers/invalid-x`, valid `FAQPage` / `BreadcrumbList` / `WebApplication` JSON-LD, and Playwright desktop `1440×900` + mobile `375×812` render (`0` console errors, `0` broken images).

---

## Milestone 2: Core Hybrid Konva Canvas Studio (Steps 1 & 2)
**Goal:** Deliver the `60fps` 3-layer Konva workbench, pixel-alpha hit-testing, 4 arrangement templates, Contextual Inspector, Wrapping Studio, `localStorage` draft engine, and 4-breakpoint shell.
- **Work Breakdown:**
  1. Build `src/lib/draft-storage.ts` (`mydigibouquet:draft:v1`, 500ms debounce, `QuotaExceeded` fallback) + `?preset|occasion|stem|replyTo=` precedence handler (preserving unsaved draft & prompting banner) + `beforeunload` dirty guard.
  2. Build `StudioSceneProvider` (`30`-step Undo/Redo, `400ms` arrow debounce, post-publish share invalidation).
  3. Build `hit-mask.ts` (`160px` `<1.8 MB` RAM + scaled screen-space `12px` mobile slop), `arranger.ts`, and `konva-stage.ts` (`StaticBackLayer`, `ActiveDragLayer` + temporary front-drape drag elevation, `StaticFrontLayer`, top `SelectionOverlayLayer` w/ unoccluded `>=44px` rotation knob, collar pivots, world-scaled Tier 1 + Tier 2 interior pocket occlusion shadows + Clear Glass caustic, single-pass `vase-clear-glass` refraction, `Cascading` `allowFrontDrape`).
  4. Build responsive Studio Shell (`100dvh` flex column mobile/portrait tablet + accessible expand button, `375px` 5-slot toolbar `[Stems][Arrange][Wrap][Layers][Undo]`, `1024px` `288px/272px` condensed bar, `1280px` desktop), Step 1 Library (Occasion Mood filters + 8 Starter Mixes + non-nested `BotanicalTile` + `15/15` cap), and Step 2 Inspector + Wrapping Studio (`9` vessels, `5` bows, `6` ribbons w/ `natural-twine`, `3` stem visibilities, `4` surfaces w/ `--dark-*`).
- **Verification Gate:** Unit test arranger/undo/vessel constraints; Playwright verification across `375×812`, `768×1024`, `1024×768`, `1440×900` checking `scrollWidth <= innerWidth`, interactive `>=44×44px` hit areas, `localStorage` draft persistence across reload, query-param conflict banner, `beforeunload` listener, `160px` hit-mask click-through on overlapping transparent petals, and keyboard shortcuts + WCAG 2.1.4 input focus guard.

---

## Milestone 3: Stationery Card, Audio & Deterministic Exports (Steps 3 & 4 UI)
**Goal:** Build DOM/Canvas text parity, mobile virtual-keyboard safety, synchronous audio playback, and memory-safe `pixelRatio: 1` exports.
- **Work Breakdown:**
  1. Build `src/lib/card-layout.ts` (`640×800` virtual card, `wrapCardMessage()`, `Intl.Segmenter` grapheme counting, `22→18→15px` step-down, `14`-line hard cap) rendered identically by `StationeryCardPreview` DOM & Canvas.
  2. Build Step 3 Card & Audio Editor (`6` templates w/ `Midnight Velvet` / `charcoal` polarity locks, `6` envelopes/seals, `4` fonts, alignment, tint/watermark, `Inspire My Note`, `Visual Keepsake Only`, `window.visualViewport` mobile header).
  3. Build `src/lib/audio-engine.ts` (`AudioContext` + `GainNode` fades synchronously in tap stack + `visibilitychange` auto-pause).
  4. Build `src/engine/canvas-renderer.ts` pure Canvas 2D compositor (`pixelRatio: 1`, sequential `1400px` decode + `700px`/JPEG `0.92` automatic low-memory fallback, dark `--dark-text-*` inks on `Evening Slate`, Tier 2 interior shadow, Clear Glass caustic + refraction, `Cascading` front-drape parity, strict `isVisualOnly: true|false` `4:5` geometry) + WebView long-press fallback modal.
- **Verification Gate:** Unit test `wrapCardMessage()` (emojis, CJK/diacritics, `\n` storms hitting 14-line cap); Playwright verification of `Midnight Velvet` polarity lock, `375×812` `visualViewport` resize during focus, Web Audio `visibilitychange` pause, and headless `1:1` / `4:5` / `9:16` export dimensions + simulated memory/fetch fallback recovery.

---

## Milestone 4: Persistence APIs, Pre-Rendered OG & `/b/[slug]` Unboxing
**Goal:** Launch server projects, CSPRNG zero-login sharing, `@napi-rs/canvas` safe-zone OG generation, moderation, and `/b/[slug]` unboxing.
- **Work Breakdown:**
  1. Build `StorageAdapter` (R2/S3 | `./storage` w/ base62-safe path regex) & `RateLimiter` (Upstash REST | in-memory sliding window).
  2. Implement `POST/GET/PUT /api/projects`, `GET/PATCH /api/preferences`, `POST /api/bouquets` (mandating `editToken` on `sourceProjectId` + flipping `status = 'published'` + synchronous `<300 KB` `1200×630` OG render), `GET /api/bouquets/[slug]`, `GET /api/og/[slug]` (strict `HTTP 404` when hidden/deleted/missing + physical `og/{slug}.jpg` purge on moderation threshold `5`), and `POST /api/report` (`409` duplicate IP dedupe).
  3. Build Step 4 Share Sheet UI (native Web Share priority on mobile, `Copy Link`, `QR PNG`, SMS/WhatsApp/Email, `hideNamesInPreview`, post-edit share badge invalidation) & `/b/[slug]` Unboxing (strict SSR `__next_f` leak scrubbing, `noindex`/`no-referrer`, bounded `<=3000ms` Decode Gate + focus handoff to revealed letter heading, dual `Create Your Own Bouquet` / `Send One Back` loop, `Report Abuse`).
- **Verification Gate:** API integration tests (`401`/`403` `sourceProjectId` IDOR check, `413` chunked body overflow, `429` `Retry-After`, `409` duplicate report, moderation hide purging OG & returning `404`, `hideNamesInPreview` stripped from SSR HTML & `<300 KB` OG JPEG); Playwright test simulating stalled stem image via `page.route` proving `/b/[slug]` still unlocks within `3000ms` and shifts focus cleanly on reveal.

---

## Milestone 5: End-to-End QA, Accessibility & Core Web Vitals Audit (Phase 4/5 Gate)
**Goal:** Prove full functional reliability across headless browsers before launch approval.
- **Verification Scope:**
  - Playwright E2E full sender -> share -> recipient journey at `375×812`, `768×1024`, `1024×768`, `1440×900` (`0` console errors, `0` uncaught exceptions, `0` failed requests, `scrollWidth <= innerWidth`).
  - Automated `@axe-core/playwright` WCAG 2.1 AA scan across Homepage, `/occasions/romance`, `/flowers/peony`, `/studio` (Light + `Evening Slate` + `Midnight Velvet`), and `/b/[slug]`.
  - Lighthouse CI (`CHROME_PATH` pointing to Playwright Chromium) checking `/` & `/b/[slug]` (`LCP < 2.0s`, `CLS < 0.05`, `TBT < 200ms`) + Playwright `web-vitals` scripted `onINP < 150ms` verification.

---

## Milestone 6: V1.1 Fast-Follow Differentiators
Scoped cleanly onto already-locked Phase 3A DB columns & endpoints:
1. Pre-signed Polaroid EXIF-free upload (`/api/media/photos/*` w/ SVG rejection, `headObject` check & unconditional `sharp` WebP re-encode) + `/api/media/[id]` authenticated access + `24h` orphan GC.
2. In-browser 45s Voice Note (`/api/media/voice` w/ offset-4 `ftyp` check & pure-JS duration parse).
3. Optional 4-digit PIN (`/api/bouquets/[slug]/unlock` async `scrypt` + HMAC cookie + RSC redaction).
4. Recipient Thank-You Echo (`/api/bouquets/[slug]/echo` `409` dedupe + `/receipt/[token]`) + expanded long-tail & i18n.
