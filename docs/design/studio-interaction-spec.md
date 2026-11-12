# Studio Canvas & Cross-Platform Interaction Specification

**Version:** `1.1 (Peer-Reviewed & Reconciled — Full-Stack, SEO & QA Sign-Off Ready)`  
**Companion Document to:** [DESIGN_SYSTEM.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/DESIGN_SYSTEM.md) & [page-specifications.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/design/page-specifications.md)  
**Target Consumers:** Full-Stack Engineering Team & QA Testing Team

---

## 1. Canonical Scene-Graph Data Contract (`schemaVersion: 1`)

Every bouquet—whether edited in Konva on Desktop (`1440px`), edited on Mobile (`375px`), exported at fixed pixels, or pre-rendered server-side for OpenGraph (`1200×630`)—uses one normalized scene graph and canonical allowlisted enumerations for Zod validation:

- **Canonical World Canvas:** `1000 × 1200` world units (`aspect 5:6`).
- **Collar / Tie Anchor Origin:** `(500, 740)` where stems gather inside the wrap or vase mouth.

### 1.1 Canonical Catalog & Theme Allowlists (`CatalogManifest`)

- **28 Botanical `SkuId` Slugs (mapped 1:1 to 12 V1 `/flowers/[species]` + `/flowers` directory):**
  - *Focal (14):* `rose-crimson`, `rose-blush`, `rose-white`, `peony-blush`, `peony-coral`, `tulip-red`, `tulip-yellow`, `sunflower`, `orchid-white`, `dahlia-burgundy`, `lily-oriental`, `hydrangea-blue`, `ranunculus-peach`, `anemone-blush`
  - *Filler (6):* `babys-breath`, `daisy-chamomile`, `lavender`, `waxflower`, `lotus`, `meadow-aster`
  - *Foliage (8):* `eucalyptus-silver`, `eucalyptus-seeded`, `fern-boston`, `olive-branch`, `ruscus-italian`, `willow-sprig`, `pine-sprig`, `dusty-miller`
  - *12 Canonical V1 `/flowers/[species]` Slugs:* `rose`, `peony`, `tulip`, `sunflower`, `orchid`, `dahlia`, `lily`, `hydrangea`, `ranunculus`, `anemone`, `lavender`, `eucalyptus` (plus all 28 indexed on `/flowers`).
  - *Color Swatch Mapping:* `Crimson` (`rose-crimson`, `tulip-red`, `dahlia-burgundy`), `Blush` (`rose-blush`, `peony-blush`, `peony-coral`, `ranunculus-peach`, `anemone-blush`, `waxflower`, `lotus`), `Ivory` (`rose-white`, `orchid-white`, `lily-oriental`, `babys-breath`, `daisy-chamomile`), `Amber` (`sunflower`, `tulip-yellow` — labeled *Gold & Amber*), `Lavender` (`lavender`, `hydrangea-blue`, `meadow-aster` — labeled *Lavender & Blue*), `Sage` (all `8` foliage stems).
- **9 `VesselId`s:** `wrap-blush-linen`, `wrap-natural-kraft`, `wrap-sage-cotton`, `wrap-midnight-charcoal`, `wrap-ivory-parchment`, `vase-clear-glass`, `vase-cream-ceramic`, `vase-warm-terracotta`, `bare-stems`.
- **5 `BowStyleId`s:** `double-bow`, `silk-tails`, `minimal-knot`, `wax-band`, `none`.
- **6 `RibbonColorId`s:** `silk-cream`, `velvet-burgundy`, `sage-satin`, `champagne-gold`, `dusty-rose`, `natural-twine` (`natural-twine` swaps in a woven matte fiber texture rather than color-tinting satin).
- **6 `CardTemplateId`s & Matched `EnvelopeId`s:** `botanical-cream`, `pressed-linen`, `midnight-velvet`, `deckle-cotton`, `blush-parchment`, `minimalist-editorial`.
- **6 `WaxSealColorId`s:** `terracotta-rose`, `antique-gold`, `forest-pine`, `ivory-pearl`, `midnight-ink`, `champagne`.

### 1.2 Strict TypeScript Scene Contract

```ts
type StemInstance = {
  id: string;              // uuid v4 per placed instance
  skuId: SkuId;            // strict 28-SKU allowlist union
  x: number;               // world bounds [140..860]
  y: number;               // clamped by stemVisibility bounds; focal head center [110..840]
  scale: number;           // clamped [0.65..1.45]
  rotationDeg: number;     // default [-45..45]; symmetric overhead SKUs allow [-180..180]
  flippedX: boolean;
  zIndex: number;          // contiguous 0..N-1
};

type PresentationConfig = {
  vesselId: VesselId;
  bowStyleId: BowStyleId;
  ribbonColorId: RibbonColorId;
  stemVisibility: "tucked" | "exposed" | "submerged";
  tableSurfaceId: "linen" | "limewash" | "travertine" | "slate";
  arrangementTemplate: "classic-round" | "airy-garden" | "cascading" | "minimalist";
};

type CardConfig = {
  templateId: CardTemplateId;
  envelopeId: CardTemplateId;
  waxSealColorId: WaxSealColorId; // canonical on envelope seal; small emblem on 4:5 print card
  fontPairingId: "editorial-serif" | "calligraphic" | "warm-literary" | "modern-atelier";
  textAlign: "left" | "center" | "right";
  paperTintId: "natural" | "ivory" | "blush" | "charcoal"; // Midnight Velvet locks dark surface ink
  showPressedPetalWatermark: boolean;
  recipientName: string;   // max 40 graphemes (Intl.Segmenter)
  senderName: string;      // max 40 graphemes
  message: string;         // max 600 graphemes, capped <=14 rendered lines
  isVisualOnly: boolean;   // skips card text & letter view for wallpaper shares
  audioTrackId: "acoustic-guitar" | "warm-piano" | "gentle-strings" | "garden-morning" | "soft-vinyl" | "silent";
};

type BouquetSceneV1 = {
  schemaVersion: 1;
  stems: StemInstance[];   // 1..15 stems (validation enforces >=3 unless arrangementTemplate === "minimalist")
  presentation: PresentationConfig;
  card: CardConfig;
  showColophon: boolean;
  hideNamesInPreview: boolean;
  occasionTag?: string;
};
```

### 1.3 Vessel Compatibility & Surface Polarity Rules

| `vesselId` Class | `supportsBow` | Allowed `stemVisibility` | Default Visibility |
| :--- | :--- | :--- | :--- |
| `wrap-*` (5 Paper Wraps) | `true` (all 5 styles) | `["tucked", "exposed"]` | `"tucked"` |
| `bare-stems` | `true` (all 5 styles) | `["exposed"]` | `"exposed"` |
| `vase-cream-ceramic`, `vase-warm-terracotta` | `false` (auto-renders `"none"`) | `["tucked"]` | `"tucked"` |
| `vase-clear-glass` | `false` (auto-renders `"none"`) | `["submerged"]` | `"submerged"` |

- **Template / Ink Polarity Rule:** `Midnight Velvet` forces dark-surface ink tokens (`--dark-text-primary: #F5F2EB`, `--dark-text-secondary: #CEC9BE`) and locks out light paper tints (`natural`, `ivory`, `blush`) in UI controls with helper text *"Midnight Velvet uses deep obsidian cotton."* Selecting `paperTintId: "charcoal"` on any other template automatically switches its ink palette to `--dark-text-primary` / `--dark-text-secondary` so AA contrast is guaranteed.

---

## 2. 3-Layer Konva Pipeline, Occlusion & Clear Glass Rendering

To maintain **`60fps` desktop / smooth mobile scrubbing** without iOS Safari WebKit Jetsam RAM spikes:

1. **Three-Layer Stage Partition:**
   - **`StaticBackLayer`:** Layer 0 Tabletop & Grounding Contact Shadow + Layer 1 Back Wrap/Vase Shell + resting stems below dragged `zIndex`.
   - **`ActiveDragLayer`:** Elevates **only** the actively dragged/selected stem during `dragstart` -> `dragend` so `pointermove` never redraws 14 sibling stems. Low-power mobile devices suppress expensive sibling `shadowBlur` filters during active `dragmove`.
   - **`StaticFrontLayer` (`listening={false}`):** Resting stems above dragged `zIndex`, Layer 3 Front Wrap Flap / Specular Glass Lip, and Layer 4 Bow overlay at `(500, 740)`.
2. **SKU Stem Anchors & Vector Clip Polygons:**
   - Each botanical cutout stores `(anchorX, anchorY)` normalized collar pivot metadata so `±45°` rotation tilts stems cleanly around the bouquet collar rather than orbiting off the vessel lip.
   - `tucked` mode clips stems strictly inside `aboveRimRect` (`y <= collarY`) unioned with the vector `inWrapPocketMask` / `ceramicInteriorMask` **and gently clamps drag `y <= 780`** so focal blooms never disappear behind opaque pockets by mistake.
   - `exposed` mode clips inside the neck collar strip while exposing neat cut ends through `y: 740..950`.
   - **`Cascading` Front Drape Exception:** Foliage/trailing stems marked `allowFrontDrape` and positioned in the lower foreground (`y > 680` and top `zIndex` quartile) render **over** Layer 3 front lip while behind Layer 4 Bow (`(500, 740)`), achieving natural floral cascading without paper-flap chopping.
3. **Clear Glass Vase Single-Pass Water Refraction (`vase-clear-glass`):**
   - Never apply translucent water-tint rects per stem (which stack into opaque teal blobs). Instead:
     1. Composite all submerged lower-stem portions (`y > waterlineY`) clipped to `glassInteriorMask` inside **one offscreen canvas pass** at `globalAlpha: 0.72` with a `+4px` vertical refraction shift.
     2. Draw **one single water-tint fill (`rgba(218, 232, 228, 0.28)`)** over that unified submerged layer.
     3. Overlay `Layer 3` crisp curved glass rim highlight, horizontal meniscus line, and base caustic shadow on top.
4. **World-Scaled Runtime Shadows & Lightweight Alpha Hit-Testing:**
   - Runtime shadow offsets & blur radii scale explicitly with `activeStageScale` (`worldOffset * stageScale`) so mobile, desktop, and `1600px` exports match.
   - **Never call full-resolution `node.cache()` for hit-testing.** Generate one lightweight `160px` max-edge alpha bitmask per SKU once on asset load (`<2 MB` total RAM, zero baked shadow artifacts) and bind custom Konva `hitFunc` with **`12%` (`alpha >= 31/255`) threshold** + **`12px` radial touch hit-slop** on mobile viewports for delicate foliage/fillers (`babys-breath`, `fern-boston`, `willow-sprig`).

---

## 3. Selection, Validation, Local Drafts & Undo Semantics

1. **`Cycle Overlapping Stem` (Deterministic Algorithm):**
   - Clicking `→` (`Cycle Overlapping`) builds a candidate list of stems whose bounding boxes intersect or lie within `85` world units of the active stem center sorted by `zIndex` descending (falling back to full `zIndex` cycle if no stems overlap nearby), selects the next candidate, shows a brief static highlight ring (`opacity` crossfade under `prefers-reduced-motion`), and updates `aria-live="polite"`: *"Selected [Stem Name], Layer X of Y"*.
2. **Touch Ergonomics & Stem Count Validation:**
   - Stage container enforces `touch-action: none` (zero 2-finger pinch on stage; scale/rotation live inside Inspector).
   - **Minimum / Minimalist Rule:** Outside `Minimalist`, sharing or exporting with `<3` stems shows non-blocking validation banner: *"Add at least 3 stems for a full arrangement, or switch template to Minimalist (1–5 stems)."* Switching an existing `6–15` stem bouquet into `Minimalist` **never deletes user stems**—it arranges all placed stems lightly and displays a soft tip (*"Minimalist works best with 1–5 stems"*).
   - Hard cap is `15` stems globally (`Duplicate` disables cleanly with inline helper `"15/15 max"`).
3. **Undo/Redo & Post-Publish Link State:**
   - History stack (`max 30 snapshots`) captures committed `BouquetSceneV1` scene edits (`pointerup`, slider commit, flip, reorder, template change, vessel/bow/surface change, `Reset Positions`, `Clear All Stems`) — arrow-key holds coalesce with `400ms` debounce so held keys commit 1 step.
   - Modifying **any** scene property after creating a `/b/[slug]` share link immediately updates the Step 4 share bar to `"Bouquet updated — Generate Updated Link"` so stale links are never left displayed as current.
4. **`localStorage` Auto-Save (`REQ-11A`) & Query Param Precedence:**
   - Key: `mydigibouquet:draft:v1` (`500ms` debounced save of compact scene JSON `~3–5 KB`, zero undo history stored; gracefully degrades to memory-only state if `QuotaExceededError` throws in Safari Private Mode; discards/resets gracefully on unknown `schemaVersion`).
   - **Precedence Rule:** If a valid non-empty saved draft exists and the user lands via `/studio?preset=...`, `/studio?occasion=...`, or `/studio?stem=...`, preserve the saved draft first and present a non-blocking dismissible banner: *"Unsaved bouquet in progress · [Load Requested Bouquet] · [Keep My Draft]"*. For `/studio?replyTo=Alex` (parsed client-side only), apply `"Alex"` to empty `recipientName` (or offer 1-click apply) without wiping stems.

---

## 4. Keyboard Accessibility Map (`WCAG 2.1 AA` Compliant)

- Canvas wrapper is keyboard-focusable (`tabIndex={0}`) and paired with the accessible **`LayerManagementStrip`** (`role="listbox"`) so keyboard-only and screen-reader users can select any stem without a pointer, synced live via `aria-live="polite"`.
- **Input Focus Guard (WCAG 2.1.4):** Single-key studio shortcuts (`Arrow*`, `[`, `]`, `+`, `=`, `-`, `F`, `PageUp`, `PageDown`, `Backspace`, `Delete`) **must no-op** whenever `document.activeElement` matches `input, textarea, select, [contenteditable]`.

| Shortcut / Key | Action |
| :--- | :--- |
| `Tab` / `Shift+Tab` | Move focus across StepHeader, Library, Layer Strip (`role="listbox"`), Canvas Stage, and Inspector |
| `Enter` / `Up/Down` (in Layer Strip) | Select stem cleanly into active focus |
| `Arrow Keys` (stem selected & stage/strip focused) | Nudge selected stem `8` world units (`Shift + Arrow`: `24` units) |
| `[` / `]` | Rotate selected stem `-5°` / `+5°` |
| `+` or `=` / `-` | Scale selected stem `+0.05x` / `-0.05x` |
| `F` / `Cmd/Ctrl + D` | Flip horizontally / Duplicate selected stem (if `<15` stems) |
| `PageUp` / `PageDown` | Bring Forward / Send Back (`zIndex`) |
| `Backspace` / `Delete` | Remove selected stem (with Undo toast) |
| `Cmd/Ctrl + Z` & `Cmd/Ctrl + Shift + Z` | Undo / Redo |
| `Escape` | Deselect active stem or close open sheet/modal |

---

## 5. Deterministic Card Text Parity, Export & iOS OOM Prevention

1. **Virtual Stationery Coordinate Frame (`640 × 800` virtual px, `4:5` ratio):**
   - Live CSS DOM preview (`Step 3` / `/b/[slug]`) and Canvas PNG exporter (`Step 4`) share the **exact same pre-computed `lines: string[]`** output from `wrapCardMessage(measurer, message, 486, fontConfig)` (`12%` inner horizontal margin -> `486px` measure width, `lineHeight: 1.55`), using **`Intl.Segmenter`** for accurate grapheme limits (`40` name / `600` message).
   - **Auto-Step & Hard Fit Cap:** Font starts at `22px`; at `>10` lines steps to `18px`; at `>13` lines steps to `15px`. Maximum total rendered card block is **`14` wrapped message lines at `15px`** (guaranteeing zero signature collision or PNG overflow across `\n` paragraphs or emojis). Typing past line `14` prevents overflow on export and shows crisp inline feedback: *"Shorten text by a few words so your whole note fits cleanly on the printable card."*
   - **Font Resolution Guard:** Canvas export explicitly awaits `Promise.all([...fonts.map(f => document.fonts.load(f))])` referencing `nextFontObject.style.fontFamily` (never raw string names!).
2. **Exact Pixel Exports (`pixelRatio: 1`) & iOS Memory Protection:**
   - All 3 export presets render at **`pixelRatio: 1`** into exact offscreen canvases (avoiding `3x` Retina multiplication that triggers `93 MB` OOM crashes on iOS):
     - **`1:1` (`1600×1600` PNG):** Bouquet centered cleanly on chosen tabletop (`padding 8%`).
     - **`9:16` (`1080×1920` PNG):** Bouquet centered horizontally at vertical baseline `y: 42%`–`78%` (safely clearing top iOS lock-screen clock!), subtle optional top greeting (`"For Maya"`) + toggleable bottom editorial colophon (`mydigibouquet.com`).
     - **`4:5` (`1440×1800` PNG):**
       - When `isVisualOnly === false`: Bouquet upper zone (`y: 6%..66%`, centered) seamlessly overlapping behind an angled/grounded open `4:5` stationery sheet occupying lower centered zone (`y: 52%..95%`, displaying card paper surface, pressed motif if enabled, small selected wax seal emblem in upper margin, greeting, `wrapCardMessage` lines, and sender signature).
       - When `isVisualOnly === true`: Bouquet fills centered vertical axis (`y: 12%..88%`) with optional subtle `"mydigibouquet.com"` colophon only.
   - **Sequential Image Decode:** Export deduplicates unique `skuId` assets and decodes `1400px` `export`-tier cutouts sequentially in small batches (releasing temporary references immediately). If an export canvas allocation fails or `export`-tier fetch fails on constrained memory devices, seamlessly fall back to `700px` `studio` cutouts or offer JPEG `0.92` / Section 8 retry banner.

---

## 6. Backend Publishing, Privacy-Safe OG & Moderation Contracts

- **`POST /api/bouquets`:**
  - Request body (`<= 32 KB` streamed JSON): `{ scene: BouquetSceneV1, sourceProjectId?: string, editToken?: string, mediaTokens?: Array<{ mediaId: string, uploaderToken: string }>, pin?: string }` (`pin` optional 4 digits in V1.1; when `sourceProjectId` present, `editToken` is mandatory to prevent IDOR and transitions project `status = 'published'`). Server validates every enum against `CatalogManifest`, strips control/Bidi characters, validates `<= 14` card lines, enforces rate limits (`429 Too Many Requests` + `Retry-After`), pre-renders `<300 KB` `1200×630` JPEG OG asset via `@napi-rs/canvas` + bundled `.woff2` fonts synchronously before committing, and returns `201 Created`:
    ```json
    { "slug": "x8K2mPq9vL3n", "shareUrl": "https://mydigibouquet.com/b/x8K2mPq9vL3n", "ogImageUrl": "https://mydigibouquet.com/api/og/x8K2mPq9vL3n", "receiptToken": "raw_receipt_secret" }
    ```
- **`GET /api/og/[slug]` (Safe-Zone & Privacy Rules):**
  - Checks active moderation status (`hidden`/`deleted`/missing -> strict **HTTP `404`**, `Cache-Control: no-store`, never serving stale CDN fallbacks). Active shares stream `1200×630` `<300 KB` JPEG (`Cache-Control: public, max-age=300, must-revalidate`) with layout inside centered **`630×630` safe square** and `--dark-text-*` inks on `Evening Slate`.
  - **Zero Message Leak:** Private `message` never enters OG pixels, `<title>`, `og:title`, `og:description`, or `twitter:*`.
  - **Privacy Redaction (`hideNamesInPreview: true`):** Omits names from `/api/og/[slug]` (*"A thoughtful floral arrangement awaits"*), `<title>`, `og:*`, `twitter:*`, and `/b/[slug]` sealed arrival header/RSC props until unsealed/unlocked!
- **`POST /api/report`:**
  - Request body: `{ slug: string, reason: "harassment" | "spam" | "inappropriate" | "other", details?: string }` -> `201 Created` flagged for moderation queue + user confirmation toast.
