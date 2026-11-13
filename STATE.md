# Project Persistent State (`STATE.md`)

**Last Updated:** 2026-11-13T09:47+05:30  
**Active Gate:** `Florist Composition Engine & Vercel Production Build — Deployed to main`  
**Specification Reference:** [SPEC.md](file:///Users/vaibhavborkar/mydigibouquet.com/SPEC.md) (`v2.0 FINALIZED`), [photorealistic-flower-library-spec.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/architecture/photorealistic-flower-library-spec.md)

---

## Locked v2.0 Architecture Decisions
1. **Photorealistic Asset Replacement:** Completely replaced cartoon/procedural flowers with 47 studio photographic botanical masters across all 18 requested flower species and 10 greenery types. Processed via boundary-constrained luma and chroma keying (`scripts/process-photo-masters.mjs`), ensuring zero halos, intact white petals (Camellia, Magnolia, White Rose), solid glaucous foliage (Silver Eucalyptus), and natural stem extensions.
2. **Complete 10-Field Metadata Standard:** Every catalog item stores Asset ID (`skuId`), Flower Name (`name`), Category (`role`), Color (`colorFamily`, `colorHex`), Image Paths (`thumbPath`, `studioPath`, `exportPath`, `hitmaskPath`), Natural Aspect Ratio (`aspectRatio`), Preferred Size (`preferredWidth`, `preferredHeight`), Botanical Type (`botanicalType`), Bloom Stage (`bloomStage`), Facing Angle (`facingAngle`), and Licensing Info (`license`).
3. **Florist Composition Engine (10 Presets):** Implemented all 10 florist preset arrangements (`Classic Round`, `Garden Romance`, `European Hand-Tied`, `Modern Minimalist`, `Wildflower Garden`, `Luxury Rose Bouquet`, `Spring Pastel`, `Sunset Bouquet`, `Elegant Monochrome`, `Premium Peony Arrangement`) with depth layering (z-index hierarchy: foliage collar background -> structural mid -> core hero focals -> foreground draping), natural fan rotation towards tie collar `(500, 720)`, and pairwise circle repulsion to prevent artificial stacking.
4. **Zero-Regressions & Vercel Parity:** Preserved all 12+ SEO pages, `/api/*` routes, `/api/og/[slug]`, LibSQL/Vercel runtime behavior, privacy controls, and dual-mode studio parity. Self-hosted fonts (`next/font/local`) eliminate Vercel build-time timeouts.

## Empirical Verification Summary (Latest Run)
- `npm run typecheck` → `0` TypeScript errors.
- `npm test` → `19/19` Vitest tests passed (`src/engine/__tests__/engine.test.ts`), verifying all 10 presets, collision clearance, depth layering, and asset parity.
- `npm run build` → `53/53` Next.js production routes built cleanly.
- `git push origin main` → Commit `4a5b860` successfully pushed to GitHub.
