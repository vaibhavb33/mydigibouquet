# Phase 2 Inter-Department Design Review Log

**Date:** 2026-11-11  
**Reviewed Artifacts:**
- [DESIGN_SYSTEM.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/DESIGN_SYSTEM.md) (`v1.1`)
- [page-specifications.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/design/page-specifications.md) (`v1.1`)
- [studio-interaction-spec.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/design/studio-interaction-spec.md) (`v1.1`)
- [product-requirements.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/research/product-requirements.md) (`APPROVED` Sync)

---

## Final Department Sign-Off Status

| Department | Reviewer Conversation | Initial Verdict | Final Re-Audit Verdict | Key Verification Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Full-Stack Engineering** | `ac76651e` / `2d07fba0` | Approved w/ Revisions (7 Critical) | **APPROVED** | `BouquetSceneV1` strict contracts, 3-layer Konva hit-mask/shadow split, single-pass `Clear Glass` refraction, `pixelRatio: 1` fixed exports + `wrapCardMessage`, `POST /api/bouquets` + safe-zone `/api/og/[slug]`. |
| **SEO, Content & Growth** | `034e7fa1` | Approved w/ Revisions (6 Critical) | **APPROVED** | Dark-surface contrast tokens, Pages 8–10 V1 SEO routes (`/occasions/[slug]`, 12 `/flowers/[slug]`, `/gallery`, legal), visible Homepage FAQ, font route isolation, `/b/[slug]` SSR LCP & viral CTA, `noindex` query param hygiene. |
| **QA & Accessibility** | `646c479c` | Blocked (8 Critical) | **APPROVED** | `100dvh` flex shell overflow fix, `375px` mobile toolbar & keyboard `visualViewport` handling, `1400px`/JPEG OOM fallback, bounded `<=3000ms` Decode Gate, WCAG 2.1 AA contrast + SC 1.4.11 + keyboard listbox + input focus guard, 1:1 schema/copy alignment. |

---

## Consolidated Critical Revisions Applied (`v1.0 → v1.1`)

1. **Strict Scene Contracts & Cross-Doc Parity (`studio-interaction-spec.md`, `DESIGN_SYSTEM.md`, `product-requirements.md`):**
   - Locked `BouquetSceneV1` (`schemaVersion: 1`) with exact allowlists for all **28 `SkuId`s**, **9 `VesselId`s** (`5 Wraps + 3 Vases + Bare Hand-Tied Stems`), **5 `BowStyleId`s**, **6 `RibbonColorId`s** (including matte `natural-twine`), **6 `CardTemplateId`/`EnvelopeId`s**, **6 `WaxSealColorId`s**, and aligned `fontPairingId: "modern-atelier"`.
   - Defined `Vessel -> supportsBow & allowedStemVisibility` compatibility matrix (`supportsBow: false` cleanly enforced on ceramic/terracotta/glass vases; wraps & bare stems support bows; `submerged` exclusive to `vase-clear-glass`).
   - Added template/ink polarity guard so `Midnight Velvet` and `paperTintId: "charcoal"` automatically lock light `--dark-text-*` tokens.
   - Standardized canonical wax seal placement on envelope closure (interactive preview + `/b/[slug]`) with subtle seal emblem in `4:5` print PNG.
2. **Konva `60fps` Engine & Fixed Export Determinism (`studio-interaction-spec.md`, `DESIGN_SYSTEM.md`):**
   - Replaced full-node `.cache()` hit-testing with pre-computed `160px` alpha bitmasks (`<2 MB` RAM, `12%` alpha threshold + `12px` mobile touch hit-slop) and 3-layer Konva split (`StaticBackLayer`, `ActiveDragLayer`, `StaticFrontLayer`).
   - Added single-pass offscreen water-tint compositing (`globalAlpha: 0.72` + single `rgba(218, 232, 228, 0.28)` layer) for `vase-clear-glass` plus collar anchors, clip polygons, and `Cascading` `allowFrontDrape` rendering.
   - Locked `pixelRatio: 1` export dimensions (`1600×1600`, `1080×1920`, `1440×1800`) with sequential `1400px` `export`-tier decoding and automatic `700px`/JPEG fallback to eliminate iOS Safari Jetsam OOM crashes.
   - Locked `640×800` virtual card coordinate frame, shared `wrapCardMessage()` lines (`max 14 lines` at `15px` floor via `Intl.Segmenter`), `nextFontObject.style.fontFamily` + `document.fonts.load(...)` resolution, and exact `4:5` (`isVisualOnly: false | true`) geometry.
3. **Responsive Ergonomics, Mobile Keyboards & Section 8 Failure States (`page-specifications.md`, `DESIGN_SYSTEM.md`):**
   - Fixed `375×812` and `768×1024` viewport overflow via `100dvh` flex column (`44px` Header + `flex: 1` Stage + `56px` Toolbar + `36%/38% dvh` sheet expanding overlay to `70%/65%` via accessible `aria-expanded` button).
   - Fixed mobile `375px` 5-slot toolbar (`[Stems][Arrange][Wrap][Layers][Undo]`) + floating `[Surface][Redo ↻]` pills, condensed `1024px` tablet bar + `288px/272px` sidebars, and `visualViewport` Step 3 soft-keyboard handling.
   - Completed Step 1 Occasion Mood filter, Botanical Role pill, and Starter Mix menu; locked non-destructive `Minimalist` switching (`6–15` stems kept) and `<3` stems share validation.
   - Added bounded `<=3000ms` `Promise.allSettled` Decode Gate on `/b/[slug]`, Export OOM fallback, and `429 Retry-After` state in Section 8.
4. **WCAG 2.1 AA, Accessibility, SEO Routes & Backend Contracts (`DESIGN_SYSTEM.md`, `page-specifications.md`, `studio-interaction-spec.md`):**
   - Added verified `--dark-*` palette tokens (`#737970` `--dark-border` >= `3.25:1`, `#A9A59B` `--dark-text-muted` ~`5.7:1`, `#F5F2EB` `--dark-text-primary` ~`12.6:1`) and dual-tone canvas selection frame over `Evening Slate`; darkened light `--text-muted` (`#5B6157`) and `--border-strong` (`#8D8677`, `3.25:1` SC 1.4.11); restricted `--accent-brass` to decorative trim.
   - Fixed `BotanicalTile` nested button compliance (WCAG 4.1.2), added keyboard `LayerManagementStrip` (`role="listbox"`) stem selection + WCAG 2.1.4 input focus guards + `=`/`+`, `F`, `Cmd+D`.
   - Added complete Pages 8–10 SSR specifications (`/occasions/[slug]`, 12 canonical `/flowers/[slug]` species, `/gallery`, `/about`, `/privacy`, `/terms`, tailored `404`s), visible Homepage FAQ accordion, query param `noindex` + canonical taxonomy, `POST /api/bouquets` + safe-zone `630×630` `/api/og/[slug]` privacy redaction + `POST /api/report` contracts.

---

## Non-Blocking Notes Carried Into Phase 3 Implementation (`SPEC.md` / `ARCHITECTURE.md`)
1. Lock canonical `/studio` (no params) as indexable (`WebApplication` JSON-LD) while parameterized `/studio?*` emits `noindex` + self-canonical `/studio`.
2. Explicitly shift keyboard/screen-reader focus to the revealed letter heading (`tabIndex={-1}`) upon clicking `"Tap to Open Your Bouquet"` on `/b/[slug]`.
3. Constrain `occasionTag` in the Phase 3 Zod schema to the 8 canonical occasion slugs, normalize stem coordinates cleanly around collar pivots `(anchorX, anchorY)`, ensure `Thank You` (`thank-you`) / `Gratitude` labels align cleanly with the 8 Starter Mix presets, and keep copy constants unified in one shared dictionary (`"Bouquet updated — Generate Updated Link"`).

