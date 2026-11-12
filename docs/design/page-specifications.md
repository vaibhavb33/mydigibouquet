# Page-by-Page Component & Layout Specifications

**Version:** `1.1 (Peer-Reviewed & Reconciled — Engineering, SEO & QA Sign-Off Ready)`  
**Companion Document to:** [DESIGN_SYSTEM.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/DESIGN_SYSTEM.md) & [studio-interaction-spec.md](file:///Users/vaibhavborkar/mydigibouquet.com/docs/design/studio-interaction-spec.md)  
**Target Viewports:** Desktop (`1280–1440px+`), Landscape Tablet (`1024–1279px`), Portrait Tablet (`640–1023px`), Mobile (`375–639px`)

---

## Page 1: Editorial Homepage (`/`)

**Goal:** Convey luxury floral craftsmanship, capture organic gifting intent via crawlable SSR Server Component HTML, and convert visitors into `/studio` in 1 click—with zero ads and zero Konva JS bundle loaded.

### Heading Outline & Section Blueprint
1. **Top Navigation Bar (`<header>`, `72px` desktop / `60px` mobile):**
   - Left: Atelier Monogram + Wordmark (`<Link href="/">MyDigiBouquet</Link>`).
   - Center Links (Desktop): `Studio` (`/studio`), `Occasions` (`/occasions`), `Flower Meanings` (`/flowers`), `Gallery` (`/gallery`).
   - Right CTA: `Create Your Bouquet` (`/studio`, `AtelierButton primary`).
   - Mobile (`<1024px`): Wordmark + compact `Create` pill (`/studio`) + `Menu` drawer button (`44×44px`).
2. **Hero Section (`<section>`, `max-w-[1280px]`, 2-col 55/45 split Desktop; Mobile shows compact eyebrow + `H1` + primary CTA directly above eager bouquet visual so `H1` and Hero image paint cleanly above the fold):**
   - *Left Column:* Eyebrow (`DIGITAL FLORAL ATELIER · FREE & NO SIGN-UP`), Editorial **`H1`** (*"Craft a Lifelike Digital Bouquet, Tuck In Your Words"*), concise 2-line subhead mentioning virtual flowers & sharable floral cards, Primary CTA (`Create Your Bouquet →` `<Link href="/studio">`), Secondary CTA (`Browse Templates` `#templates`).
   - *Right Column:* **Realistic Hero Bouquet Showcase** — pre-rendered high-resolution WebP arrangement (`aspect-[5/6]`, `sizes="(max-width: 767px) 92vw, 520px"`, eager `<Image priority />`), paired with solid `#FDFBF7` (`1px solid #DDD6C8`) bloom caption pills docked cleanly **beneath or beside** the bouquet on `<640px` (never obscuring blooms) plus interactive `"Open Sample Letter"` peek drawer (pure CSS/React state).
3. **Featured Bouquet Templates (`#templates`, `<h2>Featured Bouquet Templates</h2>`):**
   - 4-col grid (horizontal snap carousel or 2-col grid on mobile) displaying 4 curated starter arrangements (*Classic Romance*, *Sunlit Birthday*, *Quiet Apology*, *Airy Garden Gratitude*) with `<h3>` titles, recipe summary (*"9 stems · Blush Linen Wrap"*), and 1-click `<Link href="/studio?preset=...">Customize This Template →</Link>`.
4. **Browse Flowers Preview Section (`<h2>Explore Signature Blooms</h2>`):**
   - Curated 8-bloom strip from our **12 canonical V1 species** (`Peony, Garden Rose, Ranunculus, Tulip, Orchid, Sunflower, Hydrangea, Eucalyptus`). Each tile links cleanly via `<a href="/flowers/[species]">` (showing always-visible name, botanical role, 3-word symbolism, color dot) paired with a separate compact secondary `+ Studio` link (`/studio?stem=[skuId]`). Bottom CTA: `<Link href="/flowers">Explore All 28 Botanicals →</Link>`.
5. **Occasion-Based Inspiration Grid (`<h2>Bouquets for Every Moment</h2>`):**
   - 8 canonical editorial cards (*Birthday, Anniversary, Romance, Apology, Thank You, Sympathy, Miss You, Get Well*) displaying bouquet crop, thoughtful message excerpt, `<Link href="/occasions/[slug]">[Occasion] Guide →</Link>`, and quick `<Link href="/studio?occasion=[slug]">Create Your Bouquet</Link>`.
6. **How It Works (`<h2>Crafted in Three Calm Steps</h2>`):**
   - 3 numbered editorial columns (`<h3>01. Curate Lifelike Stems</h3>`, `<h3>02. Shape, Wrap & Tie</h3>`, `<h3>03. Seal Letter & Share</h3>`) with crisp product crops.
7. **Feature Highlights (`<h2>Why Our Studio Feels Real</h2>`):**
   - `2×2` bordered editorial grid: *Studio-Lit Photorealism*, *True Drag, Rotate & Layer Control*, *Tactile Cards & Keepsake Exports*, *Zero Ads & Privacy-Safe Links*.
8. **Visible Homepage FAQ Section (`<h2>Frequently Asked Questions</h2>`):**
   - 5 concise expandable `<details>` / `<button aria-expanded>` Q&As mapped 1:1 with Homepage `FAQPage` JSON-LD (*"Is MyDigiBouquet completely free with no sign-up?"*, *"Can I customize stem angles, wrapping paper, and vases?"*, *"Are my personal greeting messages kept private?"*, *"How do recipients view the bouquet on iPhone and Android?"*, *"What formats can I download as keepsakes?"*).
9. **Final CTA Banner:** Centered `#FDFBF7` cotton card (`1px solid #DDD6C8`) + `Create Your Bouquet →`.
10. **Professional Footer (`<footer>`):** 4 columns (`Brand`, `Create`, `Occasions` top 8 links, `Trust & Legal`: `/about`, `/privacy`, `/terms`). Zero ads.

---

## Page 2: Bouquet Creation Studio Shell (`/studio`)

- **Semantic landmark:** Contains visually hidden `<h1 className="sr-only">MyDigiBouquet Floral Studio</h1>` inside `<main>`.
- **Canonical URL / Indexing:** Parameterized entry URLs (`/studio?preset=`, `?occasion=`, `?stem=`, `?replyTo=`) emit `<link rel="canonical" href="https://mydigibouquet.com/studio" />` and `<meta name="robots" content="noindex" />`. `?replyTo=` is sanitized strictly client-side.

### Desktop (`>=1280px`) & Landscape Tablet (`1024–1279px`) — 4-Zone Workbench (`100dvh`)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Logo]  1. Stems & Greenery ─ 2. Wrap & Style ─ 3. Card & Audio ─ 4. Share │
├──────────────┬──────────────────────────────────────────┬──────────────────┤
│ LEFT SIDEBAR │              CENTER STAGE                │  RIGHT SIDEBAR   │
│ 320px (>=1280│                (flex-1)                  │  308px (>=1280)  │
│ 288px (1024+)│    Interactive Konva Bouquet Canvas      │  272px (1024+)   │
│ Botanical    │    (3-layer partitioned 1000×1200)       │  Contextual:     │
│ Library      │    + Tabletop backdrop selector          │  Stem Inspector  │
│ (Step 1–2)   │    + Dual-tone selection outline         │  OR Wrap/Vessel  │
├──────────────┴──────────────────────────────────────────┴──────────────────┤
│ BOTTOM BAR (56px): [Undo][Redo][Reset] | [Shape Presets] | [Layers (7/15)] │
└────────────────────────────────────────────────────────────────────────────┘
```
*(At `1024–1279px`, Shape Presets condense into a clean dropdown/pill trigger and secondary icons use icon+tooltip labels so the `56px` bar fits cleanly in a single row with zero wrap.)*

### Mobile (`375–639px`) & Portrait Tablet (`640–1023px`) — `100dvh` Flex Column Shell
```
┌──────────────────────────────────────────┐
│ [←]  1.Stems  2.Style  3.Card  4.Share   │  44px fixed (zero edge clipping)
├──────────────────────────────────────────┤
│                                          │  flex: 1 (min-h: 210px mobile,
│             LIVE BOUQUET STAGE           │  min-h: 320px tablet; touch-action: none)
│       [Surface] [Redo ↻] floating pills  │  Dark-surface aware tokens on Slate
├──────────────────────────────────────────┤
│ [Stems] [Arrange] [Wrap] [Layers] [Undo] │  56px fixed (5×75px targets >=44px)
├──────────────────────────────────────────┤
│ COLLAPSIBLE SHEET (36% dvh resting;      │  Tap-to-expand button (aria-expanded)
│ expands as overlay to 70% dvh w/ [Close])│  Zero pixel overflow on iOS Safari!
└──────────────────────────────────────────┘
```

---

## Page 3: Flower & Greenery Library (Studio Left Sidebar / Collapsible Mobile Sheet)

- **Header Row:** Title (`Botanical Library`), subtle **`Occasion Starter Mix`** 1-tap menu (all **8 canonical occasion mixes** aligned 1:1 with `/occasions/[slug]`), and stem budget pill (`7 / 15 stems` or `1–5` hint in `Minimalist`).
- **Search Input:** `--border-strong` (`#8D8677`) `>=3:1` outline, instant filter by name/meaning, `×` clear button.
- **Filter Controls (`FilterPillBar`):**
  - *Category Tabs:* `All (28)` · `Focal (14)` · `Fillers (6)` · `Foliage (8)`.
  - *Occasion Mood Chips:* `All Moods`, `Romance`, `Birthday`, `Apology`, `Thank You`, `Sympathy`.
  - *Color Swatches:* `All`, `Crimson`, `Blush`, `Ivory`, `Gold & Amber`, `Lavender & Blue`, `Sage` (dark `#1F241F` active checkmark on light swatches, `#FDFBF7` on dark swatches).
- **Botanical Grid (`2-col` on Desktop/Mobile, `3-col` on Portrait Tablet):**
  - Each `BotanicalTile` is a non-interactive card container (`WCAG 4.1.2`) displaying:
    - `<15 KB` studio WebP thumbnail (`#F7F4EE` well)
    - Always-visible **Flower Name** (`Blush Peony`), **Botanical Role pill** (`Focal` / `Filler` / `Foliage`), `<=20`-char **Meaning** (`Warmth & Honor`), and color dot.
    - Separate bottom action controls (`>=44×44px` on touch): **`+ Add`** button when `count === 0`; sibling **`−`**, **`count`**, **`+`** buttons when `count > 0`.
- **Cap State (`15/15`):** `+` controls disable cleanly with helper copy: *"Maximum 15 stems reached — swap or remove a stem to add another."*

---

## Page 4: Bouquet Customization (Canvas + Right Inspector + Bottom Layer Bar)

- **Direct Selection & Accessibility:** Pixel-alpha hit testing (`12%` threshold on downsampled `160px` hit masks + `12px` mobile hit-slop for delicate fillers), synced bi-directionally with keyboard-focusable `LayerManagementStrip` (`role="listbox"` + `aria-live="polite"` coordinates/layer announcer).
- **Dual-Tone Selection Frame:** High-contrast `#2D4739` dashed frame with `#FDFBF7` inner halo (inverts to `#F7F4EE` with `#1F241F` inner halo on `Evening Slate`) + top rotation knob (`>=3:1` over all 4 surfaces).
- **Contextual Stem Inspector (Right Sidebar / Mobile Sheet when selected):**
  1. Thumbnail, name, layer indicator, **`Cycle Overlapping Stem` (`← / →`)** buttons, and `Done` dismiss.
  2. Rotate quick chips (`-30°`, `0°`, `+30°`) + continuous slider (`±45°`, optional `Unlock 360°` for radial blooms).
  3. Scale quick chips (`S 0.8x`, `M 1.0x`, `L 1.25x`) + slider (`0.65x..1.45x`).
  4. `Bring Forward`, `Send Back`, `Flip Horizontal`.
  5. `Duplicate` (disables at `15/15` with inline `"15/15 max"` helper — no touch hover tooltip!) + `Remove Stem`.
- **Bottom Editing Bar / Mobile Layers Sheet:**
  - `Undo (⌘Z)` · `Redo (⌘⇧Z)` · `Reset` (popover: *Reset Positions* / *Clear All Stems*), **4 Arrangement Templates** (`Classic Round`, `Airy Garden`, `Cascading`, `Minimalist` — switching preserves `6–15` stems non-destructively when entering `Minimalist` with a gentle tip), `Tabletop Surface` (`Linen / Limewash / Travertine / Slate`), and `Layers (7)` accessible stack.

---

## Page 5: Bouquet Wrapping Studio (`Wrap & Style` Tab / Mobile `Wrap` Sheet)

1. **Presentation Mode (9 Vessels in `2-col` grid; `Bare Hand-Tied Stems` spans full 2 columns cleanly):**
   - *Wraps (`5`):* `Blush Linen`, `Natural Kraft`, `Sage Cotton`, `Midnight Charcoal`, `Ivory Parchment`
   - *Vessels (`3`):* `Clear Glass Vase`, `Matte Cream Ceramic`, `Warm Terracotta`
   - *Minimal (`1`):* `Bare Hand-Tied Stems`
2. **Bow Style (`5` Options — Active on Wraps & Bare Stems; Disabled cleanly on all 3 Vases with note `"Bows apply to wrapped and hand-tied bouquets"`):**
   - `Classic Double Bow` · `Flowing Silk Tails` · `Minimalist Knot` · `Wax-Sealed Band` · `No Ribbon`
3. **Ribbon Color (`6` Swatches):**
   - `Silk Cream (#EDE6D6)` · `Velvet Burgundy (#6E262B)` · `Sage Satin (#7B947E)` · `Champagne Gold (#C7A972)` · `Dusty Rose (#C28E8D)` · `Natural Twine (#9C8468)` (distinct woven fiber texture; dark `#1F241F` checkmarks on `Silk Cream` & `Champagne Gold`).
4. **Stem Visibility (`3` Explicit Options enforced per vessel compatibility matrix):**
   - `Tucked Cleanly` *(Wraps + Opaque Vases)* · `Exposed Stem Ends` *(Wraps + Bare Stems)* · `Submerged in Water` *(auto-selected on `Clear Glass Vase`)*.

---

## Page 6: Greeting Card Editor (Studio Step 3)

- **Desktop (`>=1024px`):** Left `58%` live Envelope + Wax Seal + `4:5` Card stage (with static cached bouquet snapshot badge in corner); Right `42%` scrollable form.
- **Mobile (`<1024px`) Soft-Keyboard Safety:** Listening to `window.visualViewport` keeps top **`44px` StepHeaderBar + `44px` `[Thumb] Viewing Card · Peek Bouquet`** pinned; focusing text inputs collapses the oversized graphical envelope preview into a sleek expandable `"Preview Card"` chip + live `"Lines X/14"` meter directly under `<textarea>` and scrolls the focused input comfortably above the iOS/Android keyboard.
- **Stationery Controls:**
  1. **Card Templates (`6`):** `Botanical Cream`, `Pressed Linen`, `Midnight Velvet` (dark `#232824` obsidian stationery locked to cream `--dark-text-primary` ink), `Deckle Cotton`, `Blush Parchment`, `Minimalist Editorial`.
  2. **Envelope & Wax Seal (`6` matched envelopes × `6` wax seals):** Interactive seal sits canonically on the envelope flap (`4:5` PNG adds subtle seal emblem in top stationery margin).
  3. **Typography (`4` Pairings):** `Editorial Serif`, `Handwritten Script` (`Alex Brush` display + `Lora` body), `Pressed Literary`, `Modern Atelier`.
  4. **Text Alignment (`3` options):** `Left`, `Center`, `Right`.
  5. **Background Customization:** `Paper Tint` (`Natural`, `Warm Ivory`, `Soft Blush`, `Deep Charcoal` — auto-adjusts ink polarity for AA contrast; `Midnight Velvet` locks dark polarity) + toggle **`Subtle Pressed-Petal Watermark`**.
  6. **Message Fields:** `Recipient Name` (40 graphemes), `Personal Message` (600 graphemes, live `"Lines X/14"` deterministic fit meter + `"Inspire My Note"` drawer), `Sender Name` (40 graphemes), and **`Visual Keepsake Only (No Letter)`** toggle.
  7. **Audio Track (`6`):** `Acoustic Guitar`, `Warm Piano`, `Gentle Strings`, `Garden Morning`, `Soft Vinyl`, `Silent` (Step 3 preview automatically pauses when advancing to Step 4 `Preview As Recipient` or on tab background).

---

## Page 7: Final Preview, Export & Recipient Unboxing (`/studio` Step 4 & `/b/[slug]`)

### 7.1 Sender Final Preview (`/studio` Step 4)
- Full-screen presentation on selected tabletop surface + `Preview As Recipient` overlay (`Recipient Preview Mode · [← Return to Studio]`).
- **Deterministic Keepsake Exports (`pixelRatio: 1` fixed sizes + `OOM` memory safety):**
  - `1:1` Square (`1600×1600` PNG) · `9:16` Wallpaper (`1080×1920` PNG) · `4:5` Bouquet + Card (`1440×1800` PNG; shows full centered bouquet if `isVisualOnly: true`).
  - Toggle: `Include subtle mydigibouquet.com signature` + iOS WebView modal (`<img src={blobUrl}>` + optional JPEG fallback + *"Press and hold image to Save to Photos"*).
- **Share Sheet:**
  - Toggle: `Hide names in link preview` (redacts `/api/og/[slug]`, `<title>`, `og:*`, `twitter:*`, and `/b/[slug]` closed arrival header).
  - CTA `Create Shareable Link` (`POST /api/bouquets` -> pre-renders safe-zone `1200×630` OG synchronously) -> exposes slug URL + `Copy Link`; mobile renders **native `Share Sheet` (`navigator.share`) + `Copy Link` primarily**, tucking `QR Code`, `SMS / WhatsApp`, and `Email` cleanly beneath without `375px` crowding. Editing any stem/card invalidates the active share badge (*"Bouquet updated — Generate Updated Link"*).

### 7.2 Recipient Unboxing (`/b/[slug]`)
- **Meta & Privacy Headers:** Emits `<meta name="robots" content="noindex, nofollow">`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`.
- **Headline Fallback Matrix (`--dark-text-*` applied when tabletop is `Evening Slate`):**
  - Masked (`hideNamesInPreview`): *"A thoughtful floral arrangement awaits"* (until unsealed)
  - Both names: *"For Maya, crafted with care by Alex"*
  - Recipient only: *"For Maya"* · Sender only: *"Crafted with care by Alex"* · Both blank: *"Crafted with care for you"*
- **Non-Blocking SSR LCP + Bounded Decode Gate:** Priority SSR render shows the sealed envelope + pre-composited bouquet frame immediately (`LCP < 2.0s`, `CLS = 0`). Interactive assets run `Promise.allSettled([...])` with a **`3000ms` bounded ceiling** (never deadlocks if an external asset/font stalls; displays calm `aria-live="polite"` `"Preparing your bouquet..."` label before activating **`Tap to Open Your Bouquet`**).
- **Reveal & Post-Reveal (`isVisualOnly` Aware):**
  - Tapping unseals flap synchronously (firing tap telemetry `POST /api/bouquets/[slug]/open`, shifting focus cleanly to revealed letter heading `tabIndex={-1}`), invokes `audio.play()` + `GainNode` fade (paused cleanly on `visibilitychange`), and reveals `Bouquet & Letter` · `Full Bouquet` · `Meaning of Your Blooms` rendered via static Canvas 2D (`700px` `studio` tier, zero Konva bundle). Each bloom links via `target="_blank"` to `/flowers/[species]#[colorAnchor]` for the 12 V1 species guides (or `/flowers#[skuId]` for filler/foliage SKUs). When `isVisualOnly === true`, omits empty `Bouquet & Letter` tab and presents full bouquet + `"Meaning of Your Blooms"`.
  - Bottom CTAs: `Save Keepsake Image` (`1:1` / `4:5` / `9:16` picker), primary **`Create Your Own Bouquet →`** (`/studio`), secondary **`Send One Back to [Sender]`** (when sender named, `/studio?replyTo=...`), and subtle footer `Report Abuse` (opens `ModalSheet` -> `POST /api/report`) + `Privacy` (`/privacy`).

---

## Pages 8–10: V1 SEO Content Routes & Error Views

### Page 8: Occasion Inspiration Hub (`/occasions` & `/occasions/[slug]`)
- **8 Canonical V1 Slugs:** `birthday`, `anniversary`, `romance`, `apology`, `thank-you`, `sympathy`, `miss-you`, `get-well`.
- **SSR Structure (Zero Konva JS):** Visible `BreadcrumbList` trail (`Home > Occasions > [Occasion]`), keyword-clear `H1`, curated sample bouquet `<Image priority />`, `H2 Recommended Blooms & Color Meaning`, `H2 Thoughtful Card Message Starters` (copy-to-clipboard chips + inspiration), 2–3 inline `FAQ` `<details>` items matching schema, and direct primary CTA `<Link href="/studio?occasion=[slug]">Start [Occasion] Bouquet →</Link>`.

### Page 9: Botanical Encyclopedia (`/flowers` & 12 `/flowers/[slug]` Species Pages)
- **`/flowers` Directory:** Filterable SSR showcase of all **28 V1 SKUs** linking focal/signature cards cleanly to the **12 canonical V1 species pages** (`rose, peony, tulip, sunflower, orchid, dahlia, lily, hydrangea, ranunculus, anemone, lavender, eucalyptus`), with direct `"Use in Studio"` (`/studio?stem=[skuId]`) actions.
- **`/flowers/[slug]` Species Pages:** Breadcrumb (`Home > Flowers > [Species]`), `H1 [Species] Meaning & Digital Arrangements`, sticky tabletop botanical study image, **`H2 Color Symbolism`** (with `#blush`, `#crimson`, `#white` hash anchors matched to SKU colorways!), `H2 Pairing Notes & Best Occasions`, and direct `<Link href="/studio?stem=[defaultSku]">Add [Species] to Studio →</Link>`.

### Page 10: Gallery (`/gallery`), Legal (`/about`, `/privacy`, `/terms`), Report & Tailored `404`s
- **`/gallery`:** Curated showcase of editorial bouquet compositions (click `Customize This Style` -> `/studio?preset=...`), `CollectionPage` + `CreativeWork` JSON-LD.
- **Trust Pages (`/about`, `/privacy`, `/terms`):** Clean `65ch` typographic column detailing zero-ad pledge, private-note privacy protections, image/report moderation, and data policies.
- **Tailored Branded HTTP `404`s:**
  - Unknown `/b/[slug]`: *"This bouquet link couldn't be found or was removed"* + `Create a New Bouquet →`.
  - Unknown `/occasions/[slug]`: *"That occasion guide wasn't found"* + `Explore All 8 Occasions →`.
  - Unknown `/flowers/[slug]`: *"That bloom guide isn't in our studio catalog yet"* + `Browse All Flowers →`.

---

## Section 8: Cross-Page States Matrix (Required Across All Flows)

| State | Trigger | Designed UI Response |
| :--- | :--- | :--- |
| **Loading / Decode** | Studio mount, stem decode, Export, `/b/[slug]` pre-reveal | `#EFEAE0` silhouette (`CLS = 0`); Export spinner; `/b/[slug]` `Promise.allSettled` (`<=3000ms`) gate with `aria-live="polite"`. |
| **Empty (`0` Stems)** | Fresh `/studio` or `Reset All` | Translucent dashed dome + `"Pick 3–15 blooms (or 1–5 in Minimalist) or choose an Occasion Mix"`. |
| **Validation (`<3` Stems)** | Share/Export clicked with `1–2` stems outside `Minimalist` | Inline warning toast: *"Add at least 3 stems or switch template to Minimalist."* |
| **Empty Search/Filter** | No blooms match filters | Calm `"No blooms match those filters"` + 1-tap `Reset Filters` button. |
| **Export OOM / Failure** | Safari low memory or image CORS/decode failure on PNG export | Automatic graceful fallback to `700px` `studio` tier or JPEG `0.92`, else non-blocking `#FCEEEE` retry banner + WebView long-press view. |
| **Error (`500` / `429`)** | `POST /api/bouquets` fails or hits rate limit | `500`: *"Couldn't save your link — draft is safely saved locally"* + `Retry`. `429`: *"Too many bouquets created — please wait [N]s before retrying."* |
| **Success** | Link created / PNG downloaded / Draft restored / Report submitted | `#EBF4EE` / `#235339` status toast (`"Share link ready"`, `"Saved 4:5 keepsake PNG"`, `"Draft restored · Start Fresh"`, `"Report received — thank you"`). |
