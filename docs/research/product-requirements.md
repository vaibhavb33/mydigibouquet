# Product Requirements Document (PRD)

**Document Status:** `APPROVED — UPDATED & RECONCILED WITH PHASE 2 DESIGN REVIEW`  
**Prepared by:** Senior Product Research & Strategy Team  
**Date:** 2026-11-11  
**Product Name:** MyDigiBouquet (`mydigibouquet.com`)  

---

## 1. Product Vision & Positioning

**Vision:** Build the most refined, photorealistic, and emotionally resonant digital flower bouquet studio on the web—bridging the tactile beauty of luxury floral design with zero-friction digital gifting.

**Core Positioning Statement:**  
Unlike flat 2D clip-art bouquet generators cluttered with ads (`digitalbouquet.org`), rigid static card sites (`Jacquie Lawson`), or complex pro CAD software (`Flower Architect`), `mydigibouquet.com` gives anyone the power to compose a **photorealistic, layered floral arrangement** with a **bespoke stationery card**, **exportable keepsakes**, and an **intimate unboxing reveal** in under 2 minutes—with zero ads and zero mandatory sign-up.

---

## 2. Target Personas

1. **The Thoughtful Long-Distance Partner ("Maya", 22–34, Mobile-First):** Wants an immediate, visually breathtaking romantic gesture across time zones for an anniversary, "miss you," or apology—must look realistic, feel private, and look amazing when opened on an iPhone via WhatsApp/iMessage.
2. **The Last-Minute / Budget-Conscious Celebrator ("Dev", 19–38, Desktop or Mobile):** Needs a polished birthday, graduation, or thank-you gift right now that feels infinitely more personal than a plain text or generic GIF, with downloadable Instagram Story/wallpaper export.
3. **The Aesthetic Perfectionist ("Elena", 24–45, Desktop/Tablet):** Loves curated color palettes, stationery typography, and flower symbolism; gets frustrated by random-shuffle-only builders and wants exact control over bloom rotation, layering, wrap color, and ribbon style.
4. **The Group Organizer ("Priya", 26–45, V1.2 Collaborative Persona):** Wants a team or friend group to sign one shared celebratory bouquet without spreadsheets or clunky corporate boards.

---

## 3. Functional Requirements (MoSCoW Prioritized)

### 3.1 MUST HAVE (V1 Release Gate)

| Req ID | Feature Area | Detailed Requirement & Acceptance Criteria |
| :--- | :--- | :--- |
| **REQ-01** | **Editorial Ad-Free Homepage & Occasion Entry** | - Zero display ads, inline ad pills, or sticky ad overlays anywhere on the site.<br>- Clear hero CTA (`Create Your Bouquet`), instant occasion preset cards (*Birthday, Anniversary, Romance, Apology, Thank You, Sympathy, Miss You, Get Well*), visible FAQ accordion matched to JSON-LD, lightweight static/progressive studio teaser (keeping heavy Canvas engine out of landing bundle), and SSR links to Occasions & Flower Meanings.<br>- Mobile & Desktop parity with eager above-the-fold imagery (`fetchpriority="high"`). |
| **REQ-02** | **Photorealistic Botanical Asset Catalog (28 V1 SKUs)** | - Locked V1 botanical matrix of **28 studio-lit, shadow-free, alpha-decontaminated WebP cutouts**: **14 Focal Blooms** (Rose [crimson, blush, white], Peony [blush, coral], Tulip [red, yellow], Sunflower, Orchid, Dahlia, Lily, Hydrangea, Ranunculus, Anemone), **6 Filler Blooms** (Baby's Breath, Daisy/Chamomile, Lavender, Waxflower, Lotus, Meadow Aster), and **8 Foliage stems** (Silver Dollar Eucalyptus, Seeded Eucalyptus, Fern, Olive Branch, Italian Ruscus, Willow, Pine Sprig, Dusty Miller).<br>- Delivered in **3 LOD tiers**: `thumb` (`200px`, `<15 KB`), `studio` (`700px`, `30–60 KB`), `export` (`1400px` max edge, decoded sequentially on demand to prevent iOS Safari OOM).<br>- Always-visible flower name, botanical role, and floriography meaning on both desktop and touch mobile.<br>- Filter by category, botanical color group, occasion mood, and instant search; allow **3 to 15 total stems** per bouquet (`1 to 5` allowed under `Minimalist` template). |
| **REQ-03** | **Hybrid Bouquet Canvas Engine** | - **Canvas Scene-Graph (`1000×1200` world units):** 3-layer Konva stage (`StaticBackLayer`, `ActiveDragLayer`, `StaticFrontLayer`) with `160px` pre-computed alpha hit-masks (`12%` alpha threshold + mobile touch slop) and **`"Cycle Overlapping Stem"`** button so small or occluded blooms remain selectable on mobile.<br>- **Smart Arrangement Templates:** 4 curated layouts (*Classic Round, Airy Garden, Cascading, Minimalist*) that auto-arrange selected stems cleanly (saving `6–15` stems non-destructively when entering `Minimalist`); template switches commit one atomic snapshot to Undo history, and adding a new stem in Step 1 preserves existing manual coordinates.<br>- **Direct Studio Manipulation (Progressive Disclosure):** Tapping a stem opens the **Contextual Stem Inspector** (`>=44×44px` touch targets) to **drag** (`x, y` bounded with `touch-action: none` + lift feedback), **rotate** (`±45°` natural fan default, `±180°` for radially symmetric blooms), **scale** (`0.65x–1.45x`), **reorder layer** (`bring forward` / `send back`), **flip horizontally**, **duplicate**, or **delete**, paired with full WCAG keyboard/listbox parity.<br>- **3-Tier Dynamic Shadow System:** World-scaled soft cast shadows computed dynamically after stem rotation (never baked into cutouts) + pocket interior occlusion + tabletop grounding shadow.<br>- **History:** `>=20-step` Undo/Redo (`max 30` snapshots) committing once per `pointerup` / slider commit. |
| **REQ-04** | **Decoupled Wrap, Vessel, Bow & Stem Visibility System** | - Separate controls previewed **live** in the studio:<br>  1. **Presentation (`9` options):** Paper Wraps (`5`: *Blush Linen, Natural Kraft, Sage Cotton, Midnight Charcoal, Ivory Parchment*), Vessels (`3`: *Clear Glass Vase, Matte Cream Ceramic, Warm Terracotta*), OR Minimal (`1`: *Bare Hand-Tied Stems*).<br>  2. **Bow Style (`5` options) & Ribbon Finish (`6` colors):** *Classic Double Bow, Flowing Silk Tails, Minimalist Knot, Wax-Sealed Band, No Ribbon* in *Silk Cream, Velvet Burgundy, Sage Satin, Champagne Gold, Dusty Rose, Natural Twine* (matte woven fiber variant). Active on Wraps & Bare Stems; disabled cleanly on ceramic/glass vases.<br>  3. **Stem Visibility (`3` options):** *Tucked Cleanly* (wraps & opaque vases), *Exposed Stem Ends* (wraps & bare stems), and *Submerged in Water* (Clear Glass Vase).<br>- **Dual Occlusion Pipeline:** Opaque Wraps & Ceramic vases clip lower stems inside vector interior pockets (`back → clipped stems → front flap + bow`); **Clear Glass Vase** composites submerged stems inside a single offscreen pass (`globalAlpha: 0.72` + single `rgba(218, 232, 228, 0.28)` tint) layered under specular glass highlights. |
| **REQ-05** | **Tactile Card, Envelope & Wax Seal Editor** | - Live `640×800` virtual card preview with **6 cohesive paper styles** (*Botanical Cream, Pressed Linen, Midnight Velvet, Deckle Cotton, Blush Parchment, Minimalist Editorial*), **4 metric-matched typography pairings**, **text alignment** (`left | center | right`), **paper tint customization** + **optional pressed-petal watermark** (enforcing WCAG dark-ink polarity on dark papers), **6 matching envelopes**, and **6 wax seal colors** (canonical placement on envelope closure, plus small emblem on `4:5` print PNG).<br>- Inputs: `Recipient Name` (40 graphemes, fallback *"To someone dear,"* / *"Crafted with care for you"*), `Personal Message` (up to 600 graphemes with shared DOM/Canvas line-clamping & font auto-step `22→18→15px`, hard cap `14` lines so signatures never clip), `Sender Name` (40 graphemes, fallback *"Someone thinking of you"*).<br>- Built-in **"Inspire My Note"** drawer offering occasion starters.<br>- Mobile Step-3 listens to `visualViewport` and collapses the bouquet into a compact `"Tap to Peek Bouquet"` header when editing text so soft keyboards never crush inputs. Supports `Visual Keepsake Only (No Letter)`. |
| **REQ-06** | **Curated Ambient Soundscape Player** | - 6 curated royalty-free tracks: *Acoustic Guitar, Warm Piano, Gentle Strings, Garden Morning, Soft Vinyl, Silent*.<br>- Compact AAC/M4A & MP3 audio (`<600 KB` each) invoked **synchronously** inside the `Tap to Open` call stack with Web Audio `GainNode` fades for iOS Safari compatibility, pausing on `visibilitychange`; audio UI hides cleanly when `Silent` is chosen. |
| **REQ-07** | **Deterministic Multi-Format Image Export** | - Client-side Canvas 2D export rendered at exact fixed pixels (**`pixelRatio: 1`**, gated by `document.fonts.load()`, shared `wrapCardMessage` lines, & CORS-safe/same-origin sequential `1400px` `export`-tier cutouts to avoid iOS Safari OOM) producing downloadable PNG/JPG files:<br>  - `1:1` Square Keepsake (`1600×1600`)<br>  - `9:16` Phone Wallpaper / Story Card (`1080×1920` with subtle toggleable `mydigibouquet.com` colophon)<br>  - `4:5` Printable Bouquet + Card (`1440×1800` anchored composition, expanding full-bouquet when `Visual Keepsake Only`)<br>- Includes automatic `700px`/JPEG fallback on low-memory failures and iOS/Instagram in-app WebView `"Long-Press Image to Save"` modal. |
| **REQ-08** | **Zero-Auth Sharing, Hardened Persistence & Privacy-Safe OG** | - `POST /api/bouquets` validates inputs via strict **Zod allowlists** (sanitized strings, clamped coordinates, `schemaVersion: 1`), enforces distributed rate limits (`429` + `Retry-After`), pre-renders the `1200×630` `<300 KB` JPEG OG card synchronously via `@napi-rs/canvas` + bundled local fonts into R2/S3 before responding, and returns a **12-char cryptographically random base62 slug** (`/b/[slug]`).<br>- Share sheet prioritizes native `Web Share` + `Copy Link` on mobile cleanly alongside `Download QR Code` & SMS/WhatsApp/Email, plus **`Preview As Recipient`** (zero tracking).<br>- **Privacy-Safe Dynamic OG (`630×630` Center Safe-Zone):** Renders bouquet + optional teaser strictly within `1:1` center crop safety, honoring `hideNamesInPreview` across OG, metadata, and arrival headers — **NEVER exposing the private card message body**. Includes `POST /api/report` moderation endpoint. |
| **REQ-09** | **Recipient Unboxing Experience & Viral Loop** | - Ad-free full-bleed recipient page (`/b/[slug]`) with personalized header (or masked fallback when `hideNamesInPreview: true`) and `Report Abuse` footer link.<br>- **Non-Blocking LCP + Bounded Decode Gate:** Priority envelope/frame renders immediately for `LCP < 2.0s`; `Promise.allSettled` decode gate resolves image/font readiness within `<=3000ms` (never deadlocks) before activating `"Tap to Open Your Bouquet"`.<br>- Interactive reveal: Sealed envelope → smooth unseal (`150ms` crossfade under `prefers-reduced-motion`) → tabbed `Bouquet & Letter` (hidden if `isVisualOnly`) / `Full Bouquet` / `Meaning of Your Blooms` (with `/flowers/[species]` links) → `Save Keepsake Image` (`1:1`/`4:5`/`9:16`) + primary **`Create Your Own Bouquet →`** (`/studio`) and secondary **`Send One Back to [Sender]`** (`/studio?replyTo=...`). |
| **REQ-10** | **V1 Starter SEO, Crawlability & Legal Baseline** | - Lightweight Server Component landing routes (zero studio Canvas JS, zero `Alex Brush`/`Lora` in root layout): `/` (Home + visible FAQ accordion), `/studio` (self-canonical + `noindex` stripping `?preset=`, `?occasion=`, `?stem=`, `?replyTo=`), `/occasions` + **8 canonical occasion pages** (`birthday, anniversary, romance, apology, thank-you, sympathy, miss-you, get-well`), `/flowers` + **12 canonical V1 species pages** (`rose, peony, tulip, sunflower, orchid, dahlia, lily, hydrangea, ranunculus, anemone, lavender, eucalyptus` with color-meaning `#anchors`), `/gallery`, `/about`, `/privacy`, `/terms`.<br>- Shared bouquet routes (`/b/[slug]`) are **NOT disallowed in `robots.txt`** and emit `<meta name="robots" content="noindex, nofollow">`, `X-Robots-Tag: noindex, nofollow`, and `Referrer-Policy: no-referrer`. Unknown slugs return tailored true HTTP `404`s.<br>- Route-specific JSON-LD (`WebApplication`, `Organization`, `BreadcrumbList`, `CollectionPage`/`CreativeWork`, `Article`/`DefinedTerm`, `FAQPage`) + dynamic `sitemap.xml` with `ImageObject` entries. |
| **REQ-11A** | **Auto-Saved Local Drafts (Promoted from V1.2)** | - Debounced `localStorage` draft auto-save (`schemaVersion: 1`) preserving current bouquet stems, wrap/vessel, and card draft across Safari background tab eviction/refresh, plus `beforeunload` unsaved-work protection and 1-tap *"Start Fresh / Clear Draft"* action. |

### 3.2 SHOULD HAVE (V1.1 Fast-Follow)

| Req ID | Feature Area | Detailed Requirement |
| :--- | :--- | :--- |
| **REQ-11** | **Polaroid Photo Attachment** | Attach 1–3 personal photos (client-side Canvas re-encoding to strip EXIF GPS + shrink raw uploads `<= 5 MB` into `<= 2 MB` WebP/JPEG prior to upload, unconditionally re-encoded server-side via `sharp`, w/ orphan TTL cleanup + report/takedown support) tucked beside the bouquet—available without mandatory account registration. |
| **REQ-12** | **In-Browser Voice Message** | Record up to 45s audio via browser `MediaRecorder` encoded/transcoded to universal **MP3/M4A** so Android/Chrome senders play cleanly on iOS Safari recipients, with re-record preview inside the card. |
| **REQ-13** | **Optional 4-Digit Passcode Protection** | Sender can toggle a 4-digit PIN on `/b/[slug]`; server withholds message body, photos, and voice URL from initial RSC/SSR HTML payload until PIN verification succeeds (5 attempts / 15 min lockout per `slug + IP`). |
| **REQ-14** | **Recipient Thank-You Echo** | 1-tap recipient reaction (*Heart, Hug, Smile, Tears of Joy* + short 140-char thank-you note) visible to sender via a private creator receipt URL (`/receipt/[token]`, carrying `X-Robots-Tag: noindex, nofollow`). |
| **REQ-15** | **Expanded Occasion & Botanical Hub (Long-Tail & i18n)** | Expand V1's 8 occasions + 12 focal species into seasonal occasions (`valentines-day, graduation, mothers-day, congratulations, friendship, just-because`), all 28 botanical pages, and multi-language `hreflang` foundation. |

### 3.3 COULD HAVE (V1.2)

- **REQ-16:** Animated petal-drift & bouquet bloom reveal export (GIF / WebM / MP4).
- **REQ-17:** Collaborative Group Bouquet mode (multi-contributor invite link with moderation controls).
- **REQ-18:** Scheduled delivery date/time with email notification.
- **REQ-19:** Cross-device magic-link saved bouquet history sync *(single-device `localStorage` draft recovery moved to V1 `REQ-11A`)*.

### 3.4 FUTURE ENHANCEMENTS (V2+)

- **REQ-20:** 2.5D gyroscopic/cursor parallax studio & WebGL lighting shaders.
- **REQ-21:** AI Floral Concierge (prompt-to-palette + thoughtful card draft assistant).
- **REQ-22:** Print-ready folded card PDF + local florist/affiliate real-stem ordering bridge.

---

## 4. Non-Functional Requirements

- **Performance (Core Web Vitals):**
  - Landing & recipient pages: `LCP < 2.0s`, `CLS < 0.05`, `INP < 150ms`.
  - Studio canvas interaction: `60fps` drag/rotate/scale transforms on mid-range mobile devices.
  - Asset optimization: 3-tier WebP pipeline (`thumb <15 KB`, `studio 30–60 KB`, `export 1400px` decoded sequentially on demand); single selected font pairing loaded per `/b/[slug]`.
- **Responsive Viewports:** Full functional verification at `375×812` (mobile), `390×844`, `768×1024` (portrait tablet top/bottom adaptive), `1024×768` (landscape split-pane), `1280×800`, and `1440×900` (desktop). Zero horizontal overflow (`scrollWidth <= innerWidth`), zero clipped step indicators.
- **Accessibility:** WCAG 2.1 AA contrast across light & dark (`Evening Slate` / `Midnight Velvet`) surfaces (`>=4.5:1` text, `>=3.0:1` non-text boundaries); keyboard navigation for canvas item selection (`LayerManagementStrip`) + arrow-key nudge/rotate/scale; `prefers-reduced-motion` replaces motion with `<=150ms` crossfades.
- **Reliability & Security:** Zod allowlist validation & text sanitization on all card fields, recipient/sender names, and slugs; distributed rate-limiting (`429` + `Retry-After`) on `POST /api/bouquets`; zero silent failures on API/export errors.
- **Browser Support:** Latest 2 versions of Chrome, Safari (macOS + iOS, including Instagram/WhatsApp WebViews), Firefox, and Edge.

---

## 5. Open Decisions Confirmed for Phase 2/3 Architecture

1. **Photorealistic Asset Sourcing & Lighting:** Generate/curate **28 bespoke, shadow-free, alpha-decontaminated studio botanical cutouts** + 5 wraps + 3 vessels + Bare Stems + 4 illustrated bows (with satin/matte + `natural-twine` textures) under unified **diffused `45°–60°` overhead-front softbox lighting** at a consistent `~20°–25°` tabletop angle so mixed stems and rotations stay visually natural.
2. **Backend & Canvas Stack Alignment:** Next.js App Router + TypeScript + Konva/Canvas scene-graph (`1000×1200` world units) + PostgreSQL/LibSQL + S3/R2 object storage (used from V1 for cached pre-rendered Node `@napi-rs/canvas` / `sharp` OG images, expanding to V1.1 photo/voice blobs) + Upstash Redis rate limiting.

