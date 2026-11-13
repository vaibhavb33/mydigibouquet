# Petal & Prose — v2.0 Product & Technical Architecture Specification

**Version:** `2.0`  
**Status:** Architecture Blueprint Ready for Implementation Lock  
**Preserves:** Next.js 16 App Router, Drizzle + LibSQL/SQLite schema, Konva interactive stage, Canvas 2D high-res export + `@napi-rs/canvas` `/api/og/[slug]`, 3-LOD WebP + hitmask delivery, all 12+ SEO routes.

---

## 1. Architectural Strategy: Zero-Breakage Photorealistic Upgrade

Rather than tearing down verified routes, databases, or sharing APIs, v2.0 upgrades **three core layers cleanly behind stable domain contracts (`BouquetSceneV1`, `BotanicalMeta`, `CATALOG_META_MAP`, `/api/*`)**:

1. **Photorealistic Asset Layer (`assets-master/` + `scripts/`):** Replaces Canvas 2D vector illustrations with real studio-photographed transparent RGBA master PNGs compiled through `scripts/build-assets.mjs` into `public/assets/v1/{flowers,vessels,ribbons}/*-{thumb,studio,export}.webp` + `hitmask.json`.
2. **Florist Physics & Shading Compositor (`src/engine/`):** Upgrades stem pivot math to genuine hand-tied collar convergence, enforces 5-tier botanical layering, adds multi-layered realistic AO/collar/contact shadows, introduces rich curved paper pocket clips + tissue collars, and boosts starter/auto-arrangement fullness.
3. **Dual-Mode Studio Experience (`Mode A: Quick Create` + `Mode B: Advanced Studio`):** Builds a calm 5-step guided flow (`Quick Create`) directly atop `StudioSceneProvider` while keeping the precision workstation (`Advanced Studio`) one click away without losing any stem, card, photo, or voice note mid-session.

---

## 2. Photorealistic Asset Pipeline Architecture

### 2.1 Asset Categories & Master Resolution Targets
| Asset Type | Count | Master Canvas (`assets-master/`) | Compiled WebP LODs (`public/assets/v1/`) | Alpha Extraction Method |
| :--- | :--- | :--- | :--- | :--- |
| **Botanical Stems** | 40 SKUs (all existing `skuId`s preserved 1:1) | ~840 × 1400 px RGBA PNG (upright straight-on shoot; `anchorX ≈ 0.50`, `anchorY ≈ 0.22–0.28` aligned cleanly to bloom center; woody/herbaceous stem descending to `y ≈ 0.94`) | `export` (1400px), `studio` (700px), `thumb` (200×200 bloom portrait), `hitmask` (160px bitmask) | Medium slate-grey seamless studio shoot (`#82868A`) + chroma-luminance keying + `C_fg` color unmixing (`scripts/process-photo-masters.mjs`). Dark-toned stems/foliage use perimeter flood-fill protection so internal leaf sheen stays opaque. |
| **Wraps & Vases** | 12 Vessels (`-front.png`, `-back.png`) | 1400 × 1680 px RGBA PNG matched to `WORLD_WIDTH=1000 × WORLD_HEIGHT=1200` normalized coordinates | `export` (1400×1680), `studio` (700×840) | Studio-lit folded craft/linen/vellum cones & ceramic/glass vases; split into interior back lapel + translucent/opaque front pocket layer with per-vessel smooth curved clip masks in `VESSEL_RULES`. |
| **Ribbons & Bows** | 4 finishes × 5 bow styles × 6 colors (`120` minus `none`) | 700 × 700 px RGBA PNG | `export` (700×700), `studio` (350×350) | Photorealistic master bow templates per finish+style (`silk`, `satin`, `velvet`, `twine`) photographed against grey seamless, extracted, and luminance-preserving tinted in `scripts/compile-ribbons.mjs` so specular highlights remain luminous and folds stay realistic across all 6 colors. |

### 2.2 Per-Vessel Pocket & Collar Geometry Calibration
- Update `VESSEL_RULES` in `src/engine/types.ts` so wraps no longer share a rigid 4-point trapezoid. Define smooth **8-point sculptural cone/lapel clip contours** plus subtle **tissue cuff overlay geometry** matching each photorealistic wrap silhouette (`collarY` calibrated to exact tie pinch point).
- Preserve `bare-stems` and `vase-clear-glass` (`waterlineY` + subtle water tint & refracted stem attenuation inside the submerged glass region).

---

## 3. Florist Bouquet Physics & Realism Engine (`src/engine/`)

### 3.1 Collar-Converging Spiral Stem Kinematics (`arranger.ts`)
- **Problem Fixed:** Currently rotating a stem rotates around its upper flower head (`anchorY = 0.22`), causing stem bases to splay apart inside wraps.
- **v2.0 Kinematics:**
  - Define a **Bouquet Binding Point (`pinchX = 500`, `pinchY = 720`)** inside the wrap tie / vase lip.
  - When placing bloom centers `(headX, headY)` across preset domes, rings, or organic sweeps, automatically compute the **natural radial tilt angle** `theta = atan2(headX - pinchX, pinchY - headY) * dampFactor` (so blooms gently fan outward *from the bound collar*, causing every stem stalk below the bloom to pass smoothly into the pinched collar bundle just like a real European hand-tied spiral!).
  - Clamp maximum stem overhang inside the pocket and vary stem scale organically (`0.88–1.08`) by botanical role (larger hero centerpiece blooms vs slightly daintier perimeter buds).

### 3.2 Five-Tier Botanical Z-Ordering & Lush Canopy Recipes
Every arranged bouquet orders stems cleanly across 5 natural florist layers (`reindexStems` / `arrangeBouquetByPreset`):
1. **Back Foliage Halo (`0..15%`):** Architectural leaves & tall eucalyptus framing upper silhouette corners (`-28deg` to `+28deg`).
2. **Upper & Side Cloud Fillers:** Soft baby's breath / waxflower clouds bridging outer petals.
3. **Recessed Secondary Focals:** Angled tulips, half-open roses, secondary peonies tucked slightly lower/wider (`scale 0.88–0.96`).
4. **Hero Crown Focals:** Full-bloom peonies, open heirloom roses, sunflowers, lilies centered with slight natural asymmetric height rhythm (`scale 0.98–1.08`).
5. **Foreground Collar Greens & Draped Petals:** Wispy seeded eucalyptus / velvet rose petals overlapping the wrap front cuff (`isFrontDrapeStem` & `allowFrontDrape` tuned naturally).

Starter recipes (`STARTER_BOUQUETS` & `OCCASION_TEMPLATES`) upgrade from sparse `7–10` stems to **balanced 11–14 stem lush florist bundles** (still honoring `MAX_STEMS_GLOBAL = 18` so users always have headroom to customize in Mode A or Mode B!).

### 3.3 Realistic Lighting, Contact Shadows & Shading (`canvas-renderer.ts` & `konva-stage.ts`)
1. **Directional Key Light (`top-left 35deg`) & Layered Depth Drop Shadows:** Slightly deeper soft occlusion for back-to-front petals rather than uniform blurry halos.
2. **Collar Pinch Vignette Shadow:** Soft elliptical darkening gradient directly behind the front wrap cuff / collar (`COLLAR_ANCHOR_Y`) so lower stems visibly recede deep into the paper funnel instead of floating.
3. **Sub-Ribbon Wrap Indentation Shadow:** Dedicated soft cast shadow beneath the silk/velvet/twine bow wrapping around the neck of paper wraps.
4. **Flicker-Free `BouquetCanvasDisplay.tsx`:** Keep the most recently painted frame visible while a new frame decodes (`hasEverRendered` ref/state), preventing skeleton flashes on edits or step transitions.

---

## 4. Dual-Mode Data Model & Scene Compatibility

### 4.1 Zero-Breaking Schema Compatibility (`BouquetSceneV1`)
- Keep `schemaVersion: 1` cleanly backward-compatible with all stored SQLite rows, `/b/[slug]` snapshots, and `/api/og/[slug]`.
- Track editor presentation preference via URL query (`?mode=quick` vs `?mode=studio`, defaulting clean `/studio` to **`quick`** unless opened via stem deep-link `?stem=...` or explicit `mode=studio`) + optional client draft metadata (`petal_prose_ui_mode`).
- Preserve existing `PRESET_PROFILES`, `OCCASION_TEMPLATES`, `VesselId`, `BowStyleId`, `RibbonFinishId`, `RibbonColorId`, `CardConfig`, `PhotoAttachmentRef`, and `VoiceMessageRef` enums 100% so zero shared links break.

### 4.2 Scene Synchronization Between Mode A & Mode B
- **Quick Create (`Mode A`)** writes directly to the exact same `StudioSceneProvider` state (`applyOccasionTemplate`, `applyCompositionPreset`, `setVessel`, `addStem`, `removeOneBySku`, `updateCard`, `publishShareLink`).
- **Seamless Mode Upgrade:** Clicking *"Open in Advanced Studio"* from any step switches seamlessly to `Mode B` with the user's exact arrangement, card, photos, and voice note preserved live. Returning via *"Back to Guided Flow"* keeps manual edits intact (showing a *"Custom Arrangement"* badge if individual stems were moved).

---

## 5. SEO, Public Site & Performance Architecture

- **Photorealistic Static / SSR Previews:** Update `BouquetCanvasDisplay` renders on Homepage (`/`), Gallery (`/gallery`), Occasions (`/occasions`, `/occasions/[slug]`), and `FlowerLibraryExplorer` (`/flowers`, `/flowers/[species]`) automatically via the upgraded `public/assets/v1/*.webp` and compositor — zero route signature changes needed.
- **LCP & Bundle Hygiene:** Keep Konva lazy-loaded strictly in Mode B & Interactive Canvas (Mode A can render using lightweight interactive `<canvas>` preview or lightweight Konva stage without shipping heavy inspector drawers upfront). Keep WebP sizes tight (`thumb < 18 KB`, `studio < 65 KB`).
- **Consumer Copy Polish:** Replace internal engineering terms across consumer pages (`"40 Morphological stem assets"` / `"40 botanical SKUs"` -> warm editorial copy like *"40 Studio-Lit Botanicals"* / *"Curated Florist Recipes"*).
