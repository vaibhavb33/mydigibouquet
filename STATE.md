# Project Persistent State (`STATE.md`)

**Last Updated:** 2026-11-13T09:28+05:30  
**Active Gate:** `Photorealistic Botanical Library & DigitalBouquet Benchmark Replacement — Complete & Verified`  
**Specification Reference:** [SPEC.md](file:///Users/vaibhavborkar/mydigibouquet.com/SPEC.md) (`v2.0 FINALIZED`), [photorealistic-flower-library-spec.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/architecture/photorealistic-flower-library-spec.md)

---

## Locked v2.0 Architecture Decisions
1. **Photorealistic Asset Replacement:** Completely replaced cartoon/procedural flowers with 47 studio photographic botanical masters across all 18 requested flower species and 10 greenery types. Processed via boundary-constrained luma and chroma keying (`scripts/process-photo-masters.mjs`), ensuring zero halos, intact white petals (Camellia, Magnolia, White Rose), solid glaucous foliage (Silver Eucalyptus), and natural stem extensions.
2. **Complete 10-Field Metadata Standard:** Every catalog item stores Asset ID (`skuId`), Flower Name (`name`), Category (`role`), Color (`colorFamily`, `colorHex`), Image Paths (`thumbPath`, `studioPath`, `exportPath`, `hitmaskPath`), Natural Aspect Ratio (`aspectRatio`), Preferred Size (`preferredWidth`, `preferredHeight`), Botanical Type (`botanicalType`), Bloom Stage (`bloomStage`), Facing Angle (`facingAngle`), and Licensing Info (`license`).
3. **Reference Analysis & Licensing Rights:** Full audit of `digitalbouquet.org` in `docs/research/digitalbouquet-reference-analysis.md`. Prohibited direct reuse of proprietary watercolor illustrations; implemented 100% independent bespoke studio photography under proprietary commercial license.
4. **Zero-Regressions Guarantee:** Preserved all 12+ SEO pages, `/api/*` routes, `/api/og/[slug]`, LibSQL/Vercel runtime behavior, privacy controls, and dual-mode studio parity.

## Empirical Verification Summary (Latest Run)
- `npm run typecheck` → `0` TypeScript errors.
- `npm test` → `17/17` Vitest tests passed (`src/engine/__tests__/engine.test.ts`).
- `npm run build` → `53/53` Next.js production routes built cleanly.
- `npx playwright test` → `11/11` E2E tests passed (`1.5m`) covering Mode A Quick Create, Mode B Advanced Studio, 7-viewport responsive matrix (`360px`–`1920px`), SEO, security headers/CSRF, and performance (`desktop cls: 0, homeLoadMs: 176, studioReadyMs: 651, exportMs: 935`; `mobile cls: 0, homeLoadMs: 129, studioReadyMs: 347, unboxMs: 169`).
