# Development Task Tracker (`TASK_TRACKER.md`)

**Last Updated:** 2026-11-13T09:28+05:30  
**Current Gate:** `Photorealistic Flower Library & DigitalBouquet Benchmark Replacement — Verified & Delivered`

---

## v1.0 Shipped Baseline (Verified Live on Vercel)
- [x] Phases 0–7 + Vercel production deployment (`69aa716`) — full 12-page SEO site, Drizzle/LibSQL persistence, CSRF/rate limits, `/api/og/[slug]`, exports, photo cropper, voice note, AI Florist.

## v2.0 Complete Product Redesign Gates (`FINALIZED`)
- [x] **Milestone R0 — Multi-Team Audit & v2.0 Spec Lock:** Codebase/asset audit, `digitalbouquet.org` & floral luxury competitor research, root-cause physics/UI teardown, neutral-grey studio matting feasibility test (`probe_rose`, `babys_breath`), and finalized `v2-redesign-audit.md`, `v2-redesign-architecture.md`, `v2-redesign-ux-spec.md`, `SPEC.md` v2.0.
- [x] **Milestone R1 — Photorealistic Master Botanical, Vessel & Ribbon Asset Pipeline:** Studio photo generation across botanical SKUs, pleated/ceramic/glass wrap & vase sets, and master photographic silk/satin/velvet/twine bows; automated neutral-grey keying, shadow-aware unmixing, and calibrated stem extension pipeline (`scripts/process-photo-masters.mjs`, `scripts/generate-realistic-elements.mjs`); 3-LOD WebP + bitmask recompilation (`npm run generate:v2-masters && npm run build:assets`).
- [x] **Milestone R2 — Florist Physics, Shading & Fullness Compositor:** Updated `VESSEL_RULES` curved pocket contours, collar-converging spiral stem kinematics (`src/engine/arranger.ts`), 5-tier layering, AO/pinch/contact lighting & flicker-free `BouquetCanvasDisplay`, plus lush 11–14 stem starter/occasion recipes (`presets.ts`, `occasions.ts`).
- [x] **Milestone R3 — Dual-Mode Studio (`Quick Create` & `Advanced Studio`) + Editorial Polish:** Implemented uncluttered Mode A 5-step wizard (`QuickCreateFlow.tsx`), calm Mode B Konva studio (`StudioShell.tsx`, `StudioCanvasViewport.tsx`, `InspectorAndFinishingPanel.tsx`), shared `ShareAndExportControls.tsx` and `studio-labels.ts`, responsive `360px` mobile parity, `/b/[slug]` preset resolution (`loadBouquetBySlug`), and consumer copy/visual polish across `/` and `/how-it-works`.
- [x] **Milestone R4 — Empirical Multi-Viewport QA, Visual Inspection & Verification:** `npm run typecheck` (`0` errors), `npm test` (`17/17` passed), `npm run build` (`53/53` routes), and `npx playwright test` (`11/11` passed in `3.4m` across `360px`, `390px`, `430px`, `768px`, `1024px`, `1440px`, and `1920px` with `CLS: 0`, zero horizontal overflow, zero console/page errors, plus visual inspection of rendered screenshots).
- [x] **Photorealistic Botanical Library & DigitalBouquet Benchmark Replacement:** Replaced procedural rendering with 47 high-resolution studio photographic masters across all 18 requested flower species and 10 greenery types. Added Carnation, Camellia, Zinnia, Magnolia, Leatherleaf Fern, Salal Lemon Leaf, and Variegated Pittosporum with boundary-constrained luma & chroma keying. Enriched metadata schema with all 10 required fields (`skuId`, `name`, `role`, `colorFamily`/`colorHex`, multi-LOD image paths, `aspectRatio`, `preferredWidth`/`preferredHeight`, `botanicalType`, `bloomStage`, `facingAngle`, `license`). Compiled 47 3-LOD WebP sets + 1-bit alpha bitmasks and verified with 100% passing tests (Vitest 17/17, Playwright 11/11).
