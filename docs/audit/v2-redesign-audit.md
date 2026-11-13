# Petal & Prose — v2.0 Five-Team Product, Rendering & UX Audit

**Date:** 2026-11-12  
**Prepared By:** Product Research, Floral Photography & Asset, UI/UX Design, Full-Stack Engineering, and QA/SEO Teams  
**Status:** Complete Pre-Implementation Audit (Phase 1 Redesign Discovery)

---

## 1. Executive Summary

Following verified v1.0 release readiness and live Vercel deployment (`mydigibouquet-f62b.vercel.app`), all five specialist teams conducted a deep empirical audit of the live platform (`home-desktop.png`, `studio-desktop.png`, `step3-arrange-desktop.png`, `studio-360w.png`), the live rendered bouquet output (`/api/og/preset-classic-romance`), every asset generator and compositor module (`scripts/generate-masters.mjs`, `scripts/catalog-data.mjs`, `src/engine/arranger.ts`, `src/engine/canvas-renderer.ts`, `src/engine/types.ts`), and competing digital bouquet experiences (`digitalbouquet.org`, `digibouquet.vercel.app`, `UrbanStems`, `Bloom & Wild`).

**Core Verdict:** The backend infrastructure, SEO architecture (all 12+ public routes, dynamic metadata, JSON-LD, privacy-safe share links), typography/color foundation, and interactivity (draft persistence, AI florist, cropped photos, voice notes, exports, animated wax-seal unboxing) are solid. However, **two foundational product flaws** undermine user trust and perceived quality:

1. **Synthetic, Toy-Like Bouquet Visuals:** Procedurally painted Canvas 2D flowers, bead-like foliage, rigid stem-pivot geometry around bloom crowns, flat 4-vertex trapezoid wraps, sparse bouquet fullness (~7–10 isolated stems), and zero floral collar contact shading produce an arrangement that reads as vector clip art rather than luxury floristry.
2. **Overwhelming Beginner UI Density:** Opening `/studio` drops every first-time sender directly into a 4-zone, 30+-control desktop workbench (two stacked top bars, multi-filter left sidebar with 6 role tabs + 7 swatches + tray + grid, floating 9-button canvas dock, and 4-tab dense right sidebar), and crowds mobile (`360px`) with truncated step pills (`"3. Arran..."`), a floating dock, and a 5-tab bar before making a single creative choice.

---

## 2. Asset & Visual Rendering Audit (Floral Photography + Rendering Engine Teams)

### 2.1 Existing Asset Library Audit (`assets-master/` & `scripts/generate-masters.mjs`)
- **Flowers (`40` PNGs):** 100% generated with procedural HTML5 Canvas 2D primitives (`bezierCurveTo`, concentric `drawScallopedPetal` rings, linear/radial fills). As verified on `rose-crimson-open.png`, `peony-blush-full.png`, `eucalyptus-silver.png`, `tulip-red-tilted.png`, and `babys-breath.png`:
  - Roses and peonies render as mathematically uniform concentric circles ("rosette medallions") lacking natural petal cupping, vein translucency, ruffled asymmetry, or botanical imperfections.
  - Foliage (`eucalyptus-silver`) renders as glossy uniform beads flanking a straight stick.
  - Baby's Breath (`babys-breath`) renders as small polygonal stars on rigid forks.
- **Vessels & Wraps (`22` front/back PNGs):** All 8 wraps share identical angular origami trapezoid vertices (`[330,680], [670,680], [585,1085], [415,1085]` in `src/engine/types.ts`) filled with simple 2-stop linear gradients and minimal herringbone/circle patterns (`scripts/generate-masters.mjs` lines 1373–1450). Glass/ceramic vases lack realistic rim thickness, meniscus refraction highlights, and stoneware light falloff.
- **Ribbons & Bows (`120` PNGs):** Drawn as rounded rectangles (`roundRect(-108, -14, 216, 28, 10)`) with pointed polygon tails (`scripts/generate-masters.mjs` lines 1585–1650). Missing fabric weave, natural knot compression around paper pleats, and soft specular highlights.

### 2.2 Bouquet Compositor & Physics Root-Cause Analysis
Inspecting `src/engine/arranger.ts`, `src/engine/canvas-renderer.ts`, and `src/components/unboxing/BouquetCanvasDisplay.tsx` exposed 6 structural realism failures:

| Root Cause | Current Mechanism | Visual Failure Observed |
| :--- | :--- | :--- |
| **Wrong Stem Pivot Geometry** | `stemAnchorY: 0.22` (`scripts/catalog-data.mjs`) rotates each stem around its top bloom head rather than through the florist binding collar (`COLLAR_ANCHOR_X=500, COLLAR_ANCHOR_Y=740`). | Tilted stems swing their bottom stalks into unnatural diverging angles (`| / \`) inside the wrap instead of converging cleanly into one bound hand-tied clutch. |
| **Sparse Canopy & Uniform Grids** | Starters place only `7–10` discrete stems across a wide `180px` horizontal spread (`arranger.ts`). | Large empty vertical channels remain between blooms; bouquet reads flat and spindly instead of layered and lush. |
| **Missing Collar Foliage & Depth Hierarchy** | `zIndex` relies mainly on insertion order + rough height sorting without structured floral zones (`outer-back foliage halo -> mid-ring fillers -> sculptural middle focals -> hero crown/front blooms -> tucked collar accents`). | Foliage pokes awkwardly above hero roses like antennae rather than cradling blooms in a three-dimensional botanical dome. |
| **Flat Contact Lighting** | `canvas-renderer.ts` uses uniform `ctx.shadowBlur` (`shadowColor: rgba(31,36,31,0.12)`). | Blooms float above each other without inter-petal ambient occlusion, dark cuff recesses inside wrapping paper folds, or ribbon constriction shadows. |
| **Identical Geometry Masking** | All 8 wraps clip stems to the same rigid 4-point polygon in `VESSEL_RULES`. | Stems cut off along sharp straight diagonal lines instead of disappearing organically behind tissue collars and layered paper lapels. |
| **Canvas Re-render Skeleton Flash** | `BouquetCanvasDisplay.tsx` resets `setRendered(false)` on every `scene` object change (`studio-desktop.png` Step 5 evidence). | Preview stage briefly hides rendered bouquets behind a loading skeleton circle during interactions. |

### 2.3 Empirical Verification of Photorealistic Cutout Pipeline
To avoid an unfeasible spec, the Floral Asset & Engineering teams empirically tested AI studio photography + alpha extraction before locking v2.0:
- Generated test studio blooms via `image-generator` (`probe_rose_1794463766222.jpg` on `#FFFFFF` and `babys_breath_slate_grey_1794463968256.jpg` on matte `#82868A` medium slate grey).
- **Finding:** White backdrops trap white pockets between leaves/petals and erode very pale outer petals; shooting botanicals isolated against a **shadowless neutral medium-grey / softly contrasting studio backdrop** paired with corner-measured chroma+luminance distance matting and color unmixing (`C_fg = (C_obs - (1-α)C_bg)/α`) yielded **razor-sharp, halo-free 848×1264 RGBA cutouts** even on wispy Baby's Breath (`baby-slate.png`, `baby-linen.png`).
- **Pipeline Decision:** Replace procedural flower/vessel/ribbon masters with real studio-lit photographic assets stored cleanly in `assets-master/` and compiled into the exact same 3-LOD WebP + 160px hitmask format (`scripts/build-assets.mjs`).

---

## 3. UI/UX Complexity & Competitive Research Audit

### 3.1 Competitor Teardown Summary (`digitalbouquet.org` & Benchmarks)
- **`digitalbouquet.org` & `digibouquet.vercel.app`:**
  - Users succeed immediately because they never configure 25 controls upfront. They pick flowers or a template, refine wrapped aesthetics, write their card, and share a link with zero login friction.
  - `digibouquet.vercel.app` achieves instant visual warmth by pairing parchment stationery typography with photographic transparent PNG/WebP blooms (`peony.webp`) tightly nestled in a crumpled paper wrap.
  - Weaknesses of `digitalbouquet.org`: Heavy Google AdSense clutter, abrupt Clerk login walls, no per-stem adjustment for advanced users, thin stationery customization.
- **`UrbanStems` & `Bloom & Wild`:**
  - Guide users by **Occasion & Aesthetic Style first**, pre-curate cohesive botanical color harmonies so beginners cannot make "ugly" clashing bouquets, and keep tactile card composition as an effortless emotional finale.

### 3.2 UI Complexity Audit of Current Petal & Prose (`/studio` & Public Pages)
Inspection of `studio-desktop.png`, `step3-arrange-desktop.png`, and `studio-360w.png` surfaced concrete UX clutter:
1. **Simultaneous Tool Exposure:** A beginner opening `/studio` immediately sees 2 stacked top navbars, a dense left catalog sidebar (search + 6 tabs + 7 color dots + occasion dropdown + selected items list + 2-column grid), a 9-button floating canvas dock, AND a 4-tab right inspector exposing 12 vessels + 4 surfaces + 11 occasion templates + 7 shapes simultaneously.
2. **Step vs. Tab Confusion (`studio-desktop.png`):** Having BOTH a 5-step header stepper AND an independent 4-tab right sidebar causes state desync (right panel shows `Share` while top stepper highlights `Step 4`, or mobile shows `Step 1..5` + `Flowers/Stem/Style/Card/Share` bottom tabs).
3. **Mobile Truncation (`studio-360w.png`):** Top step pill truncates `"3. Arran..."`, and stacked bars squeeze the live bouquet canvas height.
4. **Developer Jargon on Homepage (`home-desktop.png`):** Copy mentions *"40 botanical SKUs"* and *"10 layered botanical stems"* in editorial sections where warm human floristry copy belongs.

---

## 4. Preservation Inventory (Non-Negotiable Working Capabilities)

All v1.0 working systems remain intact and upgraded:
- **12+ SEO & Editorial Routes:** `/`, `/studio`, `/flowers`, `/flowers/[species]`, `/occasions`, `/occasions/[slug]`, `/gallery`, `/blog`, `/blog/[slug]`, `/about`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`, `/b/[slug]`, `sitemap.xml`, `robots.txt`.
- **Full Persistence & Media Stack:** LibSQL/SQLite (`bouquets`, `projects`, `media_assets`, `contact_messages`), CSRF + HMAC rate limiting, photo cropper (`/api/media`), voice recorder, `/api/assistant/suggest`, `/api/og/[slug]` server PNG OG generator, QR code, WhatsApp/Native Share, PNG/JPG/Transparent multi-aspect exports, and interactive animated wax-seal unboxing on `/b/[slug]`.
