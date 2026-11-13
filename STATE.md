# Project Persistent State (`STATE.md`)

**Last Updated:** 2026-11-13T11:37+05:30  
**Active Gate:** `Clean Guided Studio Redesign & Vercel Production Build — Verified & Ready`  
**Specification Reference:** [SPEC.md](file:///Users/vaibhavborkar/mydigibouquet.com/SPEC.md) (`v2.0 FINALIZED`), [photorealistic-flower-library-spec.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/architecture/photorealistic-flower-library-spec.md)

---

## Locked v2.0 Architecture Decisions
1. **Photorealistic Asset Replacement:** Completely replaced cartoon/procedural flowers with 47 studio photographic botanical masters across all 18 requested flower species and 10 greenery types. Processed via boundary-constrained luma and chroma keying (`scripts/process-photo-masters.mjs`), ensuring zero halos, intact white petals (Camellia, Magnolia, White Rose), solid glaucous foliage (Silver Eucalyptus), and natural stem extensions.
2. **Complete 10-Field Metadata Standard:** Every catalog item stores Asset ID (`skuId`), Flower Name (`name`), Category (`role`), Color (`colorFamily`, `colorHex`), Image Paths (`thumbPath`, `studioPath`, `exportPath`, `hitmaskPath`), Natural Aspect Ratio (`aspectRatio`), Preferred Size (`preferredWidth`, `preferredHeight`), Botanical Type (`botanicalType`), Bloom Stage (`bloomStage`), Facing Angle (`facingAngle`), and Licensing Info (`license`).
3. **Florist Composition Engine (10 Presets):** Implemented all 10 florist preset arrangements (`Classic Round`, `Garden Romance`, `European Hand-Tied`, `Modern Minimalist`, `Wildflower Garden`, `Luxury Rose Bouquet`, `Spring Pastel`, `Sunset Bouquet`, `Elegant Monochrome`, `Premium Peony Arrangement`) with depth layering (z-index hierarchy: foliage collar background -> structural mid -> core hero focals -> foreground draping), natural fan rotation towards tie collar `(500, 720)`, and pairwise circle repulsion to prevent artificial stacking.
4. **Clean Guided Studio UI Redesign:**
   - **Desktop Top Bar:** Minimalist Petal & Prose branding, live draft save status, My Bouquets drawer, 3D unboxing Preview button, direct Jump to Share, and seamless toggle to Advanced Studio.
   - **Hero Center Canvas:** Dominant bouquet canvas on warm ivory background (`#FBF8F3`), responsive zoom controls (`-`, reset `100%`, `+`), selected flower action bar (`↺ -15°`, `↻ +15°`, `⇄ Flip`, `Delete`, `✕ Deselect`).
   - **Bottom 4-Step Navigation:** 1. Flowers (grid cards with realistic photo thumbnails, search & category filters), 2. Style (10 visual shape cards, 7 wrapping textures, satin ribbon finishes, table backgrounds), 3. Personalize (To/From, card templates, message starters, photo/voice keepsakes), 4. Share (PNG/JPG instant export, WhatsApp & copy link).
   - **Dedicated Mobile Viewport:** Large top canvas (55vh), persistent bottom tab navigation with $\ge 48$px touch targets, collapsible bottom drawer, zero horizontal overflow.
5. **Zero-Regressions & Vercel Parity:** Preserved all 12+ SEO pages, `/api/*` routes, `/api/og/[slug]`, LibSQL/Vercel runtime behavior, privacy controls, and dual-mode studio parity. Self-hosted fonts (`next/font/local`) eliminate Vercel build-time timeouts.

## Empirical Verification Summary (Latest Run)
- `npm run typecheck` → `0` TypeScript errors.
- `npm test` → `19/19` Vitest tests passed (`src/engine/__tests__/engine.test.ts`), verifying all 10 presets, collision clearance, depth layering, and asset parity.
- `npm run build` → `53/53` Next.js production routes built cleanly.
- `npx playwright test e2e/studio.spec.ts -g "Clean Guided Interface"` → `1/1` E2E test passed across desktop and mobile iPhone viewports.
- Visual artifacts captured in scratch: `guided-studio-desktop.png` and `guided-studio-mobile-390w.png`.
