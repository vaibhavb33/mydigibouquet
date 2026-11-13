# Master Project Specification (`SPEC.md`)

**Project:** `Petal & Prose` (`mydigibouquet.com`) — Photorealistic Digital Floral Atelier  
**Specification Version:** `2.0`  
**Status:** `FINALIZED` *(GSD Planning Lock Active for v2.0 Redesign Milestones R1–R4)*  
**Last Updated:** 2026-11-12  

---

## 1. Mission & Approved Product Direction

Upgrade Petal & Prose from vector-looking Canvas 2D illustrations and an overly crowded single workbench into a **photorealistic, florist-grade digital botanical studio** with **two cohesive creation modes**:

1. **Mode A: `Quick Create` (Default Guided Experience):**  
   A calm, clutter-free 5-step flow so any user builds and sends a studio-grade photorealistic bouquet in under 60 seconds:
   - **Step 1:** Choose Occasion (cards pre-curating blooms, palette, wrap, ribbon & card tone)
   - **Step 2:** Choose Bouquet Style (composition silhouette, wrap/vase, matching ribbon/backdrop)
   - **Step 3:** Customize Flowers or Use Suggested Arrangement (clean photo cards with `+ / −`, 1-click "Refresh Suggested Mix", minimal 4-chip filter)
   - **Step 4:** Personalize Card (recipient, sender, note, tailored message starters, progressive drawer for card style/music/photos/voice)
   - **Step 5:** Preview & Share (recipient preview + test envelope reveal + private share link, WhatsApp, QR, PNG/JPG/Transparent exports)
2. **Mode B: `Advanced Studio` (Optional Craft Workstation):**  
   Full Konva spatial editing preserved seamlessly: individual stem selection with pixel-alpha hitmasks, drag-and-drop positioning, rotation, scaling, layer stack reordering/locking, full wrapping & greenery customization, ribbon finish/color/bow styles, tabletop surfaces, photo cropper, voice note, saved projects, and AI Florist assistant — toggled cleanly in 1 click without losing active bouquet work.

---

## 2. Canonical References & Team Sign-Offs

- **Audit & Research:** [v2-redesign-audit.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/audit/v2-redesign-audit.md)
- **Technical Architecture:** [v2-redesign-architecture.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/architecture/v2-redesign-architecture.md)
- **Dual-Mode UI/UX Design Spec:** [v2-redesign-ux-spec.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/design/v2-redesign-ux-spec.md)
- **Visual Design System:** [DESIGN_SYSTEM.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/DESIGN_SYSTEM.md)

---

## 3. Non-Negotiable Technical & UX Acceptance Criteria

1. **Photorealistic Asset Replacement (`M1`):**
   - Replace all 40 procedural Canvas 2D stems in `assets-master/flowers/`, 11 studio-lit wrap/vase pairs (`22` PNGs) in `assets-master/vessels/`, and silk/satin/velvet/twine ribbon bows in `assets-master/ribbons/` with **extracted real photographic assets** (neutral studio seamless matting + color-unmixed RGBA PNGs -> 3-LOD WebP + 160px bitmasks via `scripts/build-assets.mjs`).
   - Recalibrate flower `anchorY`, `headRadiusWorld`, and per-vessel `VESSEL_RULES` smooth clip cones so blooms & stems align seamlessly without haloing on both Warm Linen (`#F4EFE6`) and Evening Slate (`#262B27`).
2. **Florist Kinematics & Shading Compositor (`M2`):**
   - Replace bloom-head rotation swing with **hand-tied collar-converging stem kinematics** around `(COLLAR_ANCHOR_X, COLLAR_ANCHOR_Y)` so stems converge tightly through the ribbon tie and paper neck.
   - Enforce **5-tier botanical layering**, boost starter presets & occasion bundles to **11–14 stem natural fullness**, and add collar cuff AO, inter-stem depth shadows, sub-ribbon contact shadow, and water meniscus refraction on glass vases.
   - Eliminate canvas flicker in `BouquetCanvasDisplay.tsx` (`hasEverRendered` transition).
3. **Dual-Mode Studio & Public Editorial Polish (`M3`):**
   - Single calm top header replacing dual stacked navbars; clean `Quick Create` | `Advanced Studio` switcher preserving live `BouquetSceneV1` state.
   - Mobile `360px` zero truncation, zero horizontal overflow, live reactive bouquet stage pinned cleanly while picking occasions/styles/flowers.
   - Clean copy across `/` and public pages (zero internal `"SKU"` / `"Morphological"` developer wording on consumer copy), preserving all 12+ routes, DB persistence, `/api/og/[slug]`, exports, photos, and voice features.
4. **Empirical Verification Gate (`M4`):**
   - `npm run typecheck`, `npm test` (Vitest), `npm run build` (`53+` routes), full Playwright E2E across **Mode A (Quick Create)**, **Mode B (Advanced Studio)**, `/`, `/b/[slug]`, exports, OG PNGs across `360px`, `390px`, `430px`, `768px`, `1024px`, `1440px`, `1920px`, plus visual inspection of rendered screenshots (`home`, `quick-create`, `advanced-studio`, `mobile`, `unboxing`).
