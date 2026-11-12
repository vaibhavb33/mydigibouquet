# MyDigiBouquet — Luxury Floral Atelier Design System (`DESIGN_SYSTEM.md`)

**Version:** `1.1 (Phase 2 Blueprint — Peer-Reviewed & Reconciled Across Engineering, SEO & QA)`  
**Lead Author:** Senior UI/UX Design Team (10+ yrs Experience)  
**Approved Inputs:** [Product Requirements](file:///Users/vaibhavborkar/mydigibouquet.com/docs/research/product-requirements.md), [User Journeys](file:///Users/vaibhavborkar/mydigibouquet.com/docs/research/user-journey.md), [Feature Gap Analysis](file:///Users/vaibhavborkar/mydigibouquet.com/docs/research/feature-gap-analysis.md)

---

## 1. Design Philosophy & Anti-Generic Guardrails

`mydigibouquet.com` is designed to feel like an **intimate European floral atelier and bespoke stationery house** — calm, tactile, romantic, and unhurried.

### Visual Identity Pillars
1. **Botanical Realism First:** Flowers are the hero. Controls, panels, and borders recede into warm matte mineral/paper tones (`#F7F4EE`, `#FDFBF7`, `#EFEAE0`) so rich petal hues pop naturally.
2. **Zero Generic AI/SaaS Clichés:** Strictly no neon purple/pink gradients, no glassmorphic blur blobs, no floating SaaS cards with heavy drop shadows, no comic outlines, and zero display ads.
3. **Tactile Materiality Over Chrome:** Use crisp `1px` flax hairlines, subtle paper grain on stationery surfaces, antique brass micro-accents, and editorial serif/sans hierarchy.
4. **Photorealistic Assets Over Generic Icons:** Every bloom, stem, wrap, ribbon, and wax seal uses studio-lit photographic/botanical cutouts. Vector icons (`1.5px` stroke) are reserved strictly for functional UI controls (Undo, Zoom, Layer Up/Down, Close, Search).
5. **Effortless Clarity on Every Screen:** Beginners achieve beauty in 2 taps via templates; perfectionists fine-tune every stem via progressive disclosure without cluttering mobile screens.

---

## 2. Color System & WCAG 2.1 AA Contrast Matrix

### 2.1 Core Semantic Tokens (Light Atelier Theme — Default)

| Token Name | Hex | Role & Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#F7F4EE` | Primary page background (Warm Atelier Cream) |
| `--bg-surface` | `#FDFBF7` | Elevated panels, sidebars, stationery cards (Cotton Ivory) |
| `--bg-well` | `#EFEAE0` | Studio canvas surround, inputs, inactive pills (Limestone Sand) |
| `--bg-hover` | `#E6DFD1` | Subtle hover fill on neutral interactive chips |
| `--border-hairline` | `#DDD6C8` | Decorative card dividers and non-interactive panel separators only (`>=1px`) |
| `--border-strong` | `#8D8677` | Interactive form input borders, checkboxes, resting toggle outlines (`>=3.0:1` SC 1.4.11) |
| `--text-primary` | `#1F241F` | Headlines, primary labels, body copy (Botanical Charcoal) |
| `--text-secondary` | `#52584F` | Supporting copy, descriptions, secondary labels (Moss Slate) |
| `--text-muted` | `#5B6157` | Captions, stem counters, metadata (Sage Stone — AA safe on well & hover) |
| `--accent-primary` | `#2D4739` | Primary CTAs, active step badges, selection rings (Forest Atelier) |
| `--accent-primary-hover` | `#21352A` | Primary CTA hover / pressed state |
| `--accent-primary-soft` | `#E7EEE9` | Soft tint background for selected flower tiles & active badges |
| `--accent-romantic` | `#8E4A49` | Romantic highlights, wax-seal cues, heart actions (Terracotta Rose) |
| `--accent-romantic-soft` | `#F6ECEB` | Soft blush tint for featured occasion tags |
| `--accent-brass` | `#9A702E` | Strictly decorative metallic trim (`>=2px`) & ornamental foil borders — **never use for body/badge text** |
| `--accent-brass-text` | `#75531B` | Small text/labels/active badges in brass tone (AA compliant) |
| `--focus-ring` | `#2D4739` | `2px` solid ring with `2px` offset (`#FDFBF7` inner gap); paired dual-halo on dark surfaces |

### 2.2 Status & Feedback Tokens

| State | Text / Icon Ink | Surface Fill | Border |
| :--- | :--- | :--- | :--- |
| **Success** | `#235339` | `#EBF4EE` | `#B9D7C4` |
| **Warning** | `#7A5114` | `#FBF4E6` | `#E6CFA3` |
| **Error** | `#962D28` | `#FCEEEE` | `#E5B8B5` |
| **Info / Tip** | `#2C4959` | `#ECF3F7` | `#BDD3DF` |

### 2.3 Dark Surface & Dark Stationery Tokens (`Evening Slate`, `Midnight Velvet`, `charcoal`)
Activated automatically via `[data-surface="slate"]` or dark stationery polarity so dark tabletops and dark cards pass WCAG 2.1 AA:

| Token Name | Hex | Role & Contrast Notes |
| :--- | :--- | :--- |
| `--dark-surface` | `#262B27` | `Evening Slate` studio tabletop / `/b/[slug]` backdrop |
| `--dark-card` | `#232824` | `Midnight Velvet` / `charcoal` dark stationery paper |
| `--dark-text-primary` | `#F5F2EB` | Salutation, body text, stage headers (`~12.6:1` on `#262B27`, `~13.1:1` on `#232824`) |
| `--dark-text-secondary` | `#CEC9BE` | Supporting metadata & signatures (`~8.5:1` on `#262B27`) |
| `--dark-text-muted` | `#A9A59B` | Captions & attributions (`~5.7:1` on `#262B27`) |
| `--dark-border` | `#737970` | Card hairlines & interactive outlines (`~3.25:1` SC 1.4.11 on `#262B27` & `#232824`) |
| `--selection-frame-light` | `#2D4739` + `#FDFBF7` halo | Canvas selection outline over `linen`, `limewash`, `travertine` |
| `--selection-frame-dark` | `#F7F4EE` + `#1F241F` halo | High-contrast canvas selection outline & focus ring over `Evening Slate` (`~13.8:1`) |

### 2.4 Studio Tabletop Surface Options (Bouquet Backdrop)
Users and recipients view arrangements over 4 calm studio surfaces (rendered via lightweight CSS gradients or `<10 KB` tiled WebP weave — never harsh `#FFFFFF` or neon gradients):
1. **Warm Linen** (`#F4EFE6` matte subtle weave) — *Default*
2. **Soft Limewash** (`#EAE6DF` soft plaster texture)
3. **Blush Travertine** (`#F5ECE8` warm mineral stone)
4. **Evening Slate** (`#262B27` dark charcoal studio backdrop with `--dark-*` overlay tokens — makes white orchids/peonies glow dramatically)

### 2.5 Verified Contrast Compliance (WCAG 2.1 AA)
- `#1F241F` on `#F7F4EE` / `#FDFBF7`: **`~14.2:1`** (Exceeds AAA)
- `#52584F` on `#FDFBF7` / `#EFEAE0`: **`~6.8:1`** / **`~6.1:1`** (Exceeds AA)
- `#5B6157` (`--text-muted`) on `#FDFBF7` / `#EFEAE0` / `#E6DFD1`: **`~5.8:1`** / **`~5.1:1`** / **`~4.65:1`** (Passes AA normal text across all light surfaces)
- `#8D8677` (`--border-strong`) on `#FDFBF7`: **`~3.25:1`** (Passes WCAG 1.4.11 non-text boundary contrast `>=3.0:1`)
- `#FDFBF7` on `#2D4739` (Primary CTA): **`~9.7:1`** (Exceeds AAA)
- `#FDFBF7` on `#8E4A49` (Romantic CTA): **`~5.7:1`** (Passes AA)
- `#75531B` (`--accent-brass-text`) on `#FDFBF7`: **`~6.1:1`** (Passes AA; `#9A702E` disabled for small text)
- `#F5F2EB` / `#A9A59B` on `#262B27` (`Evening Slate`): **`~12.6:1`** / **`~5.7:1`** (Exceeds AA)
- `#962D28` on `#FCEEEE` (Error banner): **`~6.2:1`** (Passes AA)

---

## 3. Typography System & Stationery Pairings

All fonts are self-hosted via `next/font/google` (`display: swap` + fallback metric adjustment) to prevent Cumulative Layout Shift (`CLS < 0.05`).

- **Route Font Isolation:** The root layout loads **only** `Cormorant Garamond` + `Plus Jakarta Sans` (`LCP` protection for `/` and SEO routes). `Alex Brush` and `Lora` load **strictly within `/studio`** and **on demand** for `/b/[slug]` when selected by the bouquet.
- **Canvas Export Parity:** Offscreen PNG export resolves `ctx.font` via `next/font`'s `fontObject.style.fontFamily` and explicitly awaits `document.fonts.load(...)` for required weights. Node.js `@napi-rs/canvas` OG renders bundle local `.woff2`/`.ttf` binaries on disk.

### 3.1 UI & Editorial Type Scale (`16px` Base)

| Role | Font Family | Desktop Size / Line Height | Mobile Size / Line Height | Tracking / Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero (`H1`)** | `Cormorant Garamond` | `56px / 62px` (`3.5rem`) | `36px / 40px` (`2.25rem`) | `-0.02em` / `500` |
| **Section Heading (`H2`)** | `Cormorant Garamond` | `40px / 46px` (`2.5rem`) | `28px / 34px` (`1.75rem`) | `-0.015em` / `500` |
| **Subheading (`H3`)** | `Cormorant Garamond` | `26px / 32px` (`1.625rem`) | `22px / 28px` (`1.375rem`) | `-0.01em` / `600` |
| **Lead Editorial Copy** | `Plus Jakarta Sans` | `18px / 28px` (`1.125rem`) | `16px / 25px` (`1rem`) | `0` / `400` |
| **Body Default** | `Plus Jakarta Sans` | `15px / 24px` (`0.9375rem`) | `15px / 23px` | `0` / `400` |
| **UI Control / Button** | `Plus Jakarta Sans` | `14px / 20px` (`0.875rem`) | `14px / 20px` | `+0.01em` / `600` |
| **Eyebrow / Step Label** | `Plus Jakarta Sans` | `12px / 16px` (`0.75rem`) | `12px / 16px` | `+0.10em` uppercase / `600` |
| **Micro Label / Stem Counter** | `Plus Jakarta Sans` | `12px / 16px` (`0.75rem`) | `12px / 16px` | `+0.01em` / `500` (`tabular-nums`) |

### 3.2 Greeting Card Typography Pairings (4 Curated Options)
To preserve Core Web Vitals (`LCP < 2.0s`), recipient pages (`/b/[slug]`) dynamically load **only the single font pairing selected** for that bouquet:

| Pairing ID | Label | Salutation / Signature Font | Message Body Font | Aesthetic Feel |
| :--- | :--- | :--- | :--- | :--- |
| `editorial-serif` | **Editorial Serif** | `Cormorant Garamond` (`600 Italic`) | `Cormorant Garamond` (`400`) | Classic French florist note |
| `calligraphic` | **Handwritten Script** | `Alex Brush` (`400`, display greeting only; falls back cleanly to `Lora Italic` for extended diacritics/non-Latin glyphs) | `Lora` (`400`) | Personal warmth without sacrificing 600-char legibility |
| `warm-literary` | **Pressed Literary** | `Lora` (`600`) | `Lora` (`400`) | Intimate bookish letterpress |
| `modern-atelier` | **Modern Atelier** | `Plus Jakarta Sans` (`600`) | `Plus Jakarta Sans` (`400`) | Crisp gallery-card elegance |

---

## 4. Spacing, Layout Grid & Responsive Breakpoints

### 4.1 Spacing Scale (`4px` Base Unit)
`4px` (`space-1`), `8px` (`space-2`), `12px` (`space-3`), `16px` (`space-4`), `20px` (`space-5`), `24px` (`space-6`), `32px` (`space-8`), `48px` (`space-12`), `64px` (`space-16`), `96px` (`space-24`).

### 4.2 Breakpoints & Studio Shell Adaptation

| Breakpoint | Range | Marketing / Content Grid | Studio Layout Architecture (`100dvh` Flex Column Shell) |
| :--- | :--- | :--- | :--- |
| **Mobile** | `375px – 639px` | 1-col (`16px` outer gutters) | `44px` Top Step Header + **`flex: 1` Live Stage (`min-h-[210px]`)** + **`56px` Compact Bottom Toolbar** + **Docked Bottom Sheet (`36% dvh`, toggleable overlay to `70% dvh` via header tap button)** — zero vertical overflow |
| **Portrait Tablet** | `640px – 1023px` | 2-col (`24px` gutters) | `44px` Top Step Header + **`flex: 1` Live Stage (`min-h-[320px]`)** + **`56px` Bottom Toolbar** + **Dockable Bottom Sheet (`38% dvh`, overlay expand to `65% dvh`)** |
| **Landscape Tablet** | `1024px – 1279px` | 12-col (`max-w-[1160px]`) | **3-Pane Workbench:** Left Drawer (`288px`) + Center Canvas (`flex-1`, `>=464px`) + Right Inspector (`272px`) + Bottom Layer Bar (`56px`, condensed icons/dropdown at `<1200px`) |
| **Desktop** | `1280px – 1440px+` | 12-col (`max-w-[1280px]`, `32px` gutters) | **3-Pane Workbench:** Left Drawer (`320px`) + Center Canvas (`flex-1`) + Right Inspector (`308px`) + Bottom Layer Bar (`56px`) |

### 4.3 Radius & Elevation Tokens
- **Radii:** `--radius-sm: 8px` (thumbnails, inputs), `--radius-md: 12px` (cards, inspector drawers), `--radius-lg: 20px` (studio modals, bottom sheets), `--radius-pill: 9999px` (CTAs, filter chips).
- **UI Elevation:** Flat `1px solid var(--border-hairline)` by default; floating sheets/popovers use whisper shadow `0 10px 30px -8px rgba(31, 36, 31, 0.10)`. **Zero heavy dark drop shadows on UI panels.**

---

## 5. Photorealistic Botanical Asset & Shadow Standards

1. **Unified Studio Art Direction:**
   - All **28 V1 botanical SKUs** (`14 Focal Blooms`, `6 Fillers`, `8 Foliage`), **9 Presentation Modes** (`5 Paper Wraps` + `3 Vessels` + `1 Bare Hand-Tied Stems`), **5 Bow Options** (`4 Cutout Bows` × satin/matte colorways + `natural-twine` fiber variant + `No Ribbon`), and **6 Wax Seals** share a cohesive **`~20°–25°` tabletop florist camera elevation** and **soft diffused `45°–60°` overhead-front key light** so rotating stems up to `±45°` (or `±180°` on symmetric overhead blooms) never breaks lighting direction.
   - **3-Tier Asset LODs (`WebP`, strictly same-origin `/assets/...` or verified CORS-safe headers):**
     - `thumb`: `200×200px` (`<15 KB`) — picker grid
     - `studio`: `700px` max edge (`30–60 KB`) — interactive `60fps` canvas & mobile recipient view
     - `export`: `1400px` max edge — deduplicated by `skuId` and drawn sequentially on export canvas (`pixelRatio: 1`, prevents iOS Safari Jetsam crashes while keeping `>1.5×` resolution margin on `1600px` exports)
2. **Shadow-Free Cutouts + 3-Tier World-Scaled Canvas Shadows:**
   - **Rule:** Source cutouts MUST contain **zero baked cast drop shadows** (preventing shadows from rotating upside down when tilted).
   - **Canvas Performance Split:** Stage separates into `StaticBackLayer`, `ActiveDragLayer`, and `StaticFrontLayer` (`listening={false}`), using `160px` pre-computed alpha bitmasks (`<2 MB` RAM) instead of heavy full-res `.cache()` nodes.
   - **Canvas Runtime Shadows (scaled by `activeStageScale`):**
     - *Tier 1 (Inter-Stem Depth Shadow):* Pre-tinted / lightweight soft warm charcoal shadow (`rgba(28, 25, 21, 0.14)`, world offset `(4, 8)`) computed after rotation; low-end mobile suspends expensive runtime `shadowBlur` during active `dragmove` on non-selected siblings.
     - *Tier 2 (Interior Pocket Occlusion):* Soft radial shadow inside wrap/ceramic rim darkening lower stems before tucking behind the front flap.
     - *Tier 3 (Tabletop Contact Shadow):* Grounded elliptical shadow beneath wrap tip / vase base (plus translucent warm glass caustic shadow for `Clear Glass Vase`).

---

## 6. Motion & `prefers-reduced-motion` Specification

- **Principles:** Purposeful, physical, weighted—never bouncy cartoon physics or distracting idle loops.
- **Standard Curves:** `--ease-atelier: cubic-bezier(0.22, 1, 0.36, 1)` (`220ms` panels/drawers, `320ms` stem insertion fade+scale `0.94 → 1`, `550ms` recipient envelope unseal).
- **GPU Only:** Animate strictly `transform` and `opacity`.
- **`prefers-reduced-motion: reduce`:** All sliding, scaling, petal shimmer, drag lift scale (`1.05`), and pulsing audio/CTA cues immediately degrade to calm `150ms` opacity crossfades with static elevated border indicators.

---

## 7. Reusable Component Inventory

Every reusable primitive supports `default`, `hover`, `active/selected`, `focus-visible`, `disabled`, and `loading` states, with minimum **`44×44px` touch targets** on mobile/tablet:

| Component | Variants & Key Props | Accessibility & Responsive Rules |
| :--- | :--- | :--- |
| **`AtelierButton`** | `primary` (`#2D4739`), `romantic` (`#8E4A49`), `secondary` (ivory + flax/strong border), `ghost`, `danger-outline`; sizes `sm` (`>=36px` visual / `44px` hit target on touch), `md` (`44px`), `lg` (`52px`); `isLoading` spinner preserves width | Explicit `aria-busy` on async submit; dual-tone `focus-visible` ring (`>=3:1` over light & `Evening Slate`) |
| **`StepHeaderBar`** | 4 steps: `1. Stems`, `2. Wrap & Style`, `3. Card & Audio`, `4. Preview & Share`; supports non-linear jump | Mobile (`375px`) uses compact `grid-cols-4` with concise labels (`Stems`, `Style`, `Card`, `Share`) — **zero horizontal overflow or edge clipping** |
| **`BotanicalTile`** | Non-clickable wrapper card containing `<img thumb>`, Flower Name, Botanical Role badge (`Focal/Filler/Foliage`), `<=20`-char Meaning Tag, Color Dot, count badge, and **separate bottom action control** (`+ Add` or `[ - ] [ count ] [ + ]`) | Zero nested interactive elements (`WCAG 4.1.2`); touch buttons guarantee `>=44×44px` tap area; dark `#1F241F` checkmarks on light swatches |
| **`FilterPillBar`** | Category tabs, Occasion mood selector, botanical color swatches, + Search input (`clear ×` button, `--border-strong` `>=3:1`) | Horizontal scroll container includes `fade-edge` hint + clickable left/right scroll buttons for keyboard/mouse; wraps cleanly at `>=640px` |
| **`InspectorPanel`** | Properties mode (Rotate slider + presets, Scale `S/M/L` + slider, Flip, Forward/Back, Cycle Overlapping, Duplicate, Remove) vs. Wrapping mode | Contextual on Mobile (`>=44px` expand/close toggle button alongside drag handle — WCAG 2.5.7); Duplicate disables cleanly with inline label on `15/15` cap |
| **`LayerManagementStrip`** | Interactive accessible `role="listbox"` layer chips / drawer (`Top` → `Back`) with keyboard selection, `↑`/`↓` reorder, and delete | Synchronizes bi-directionally with Konva canvas selection and announces active stem via `aria-live="polite"` |
| **`StationeryCardPreview`** | Renders 6 paper textures (respecting dark-ink polarity on `Midnight Velvet` / `charcoal`), 4 typography pairings, `left`/`center`/`right` alignment, optional pressed-petal watermark, and print-mode wax emblem (envelope closure in interactive studio) | Renders exact `wrapCardMessage()` `lines[]` array inside fixed `640×800` scaled frame matching `4:5` Canvas export |
| **`AudioTrackBar`** | 6 tracks + Play/Pause preview + Mute toggle + static progress bar (pulse optional outside reduced motion) | Hidden completely on recipient view if `Silent`; invokes `audio.play()` + `GainNode` synchronously on tap |
| **`ToastBanner` & `ModalSheet`** | Non-blocking feedback (`"Arranged — Undo"`, `429` retry timer, `Report Abuse`, WebView long-press image modal) | `role="status"` / `aria-live="polite"`; Escape key & backdrop dismiss; explicit `<img src={blobUrl}>` WebView fallback |
| **`SkeletonCard` & `EmptyStageState`** | Translucent botanical line silhouette while loading or `<3` stems outside `Minimalist` | Zero layout jump (`CLS = 0`); dark-surface aware stroke tokens on `Evening Slate` |

