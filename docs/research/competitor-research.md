# Competitor & Reference Product Research

**Prepared by:** Senior Product Research & Strategy Team  
**Date:** 2026-11-11  
**Project:** `mydigibouquet.com` — Premium Photorealistic Digital Bouquet Studio  
**Scope:** Empirical live teardown of `https://digitalbouquet.org/` plus comparative analysis of 8 direct and adjacent competitors across digital bouquet builders, 3D floral design editors, virtual stationery platforms, and online gifting experiences.

> **IP & Originality Guardrail:** All findings below inform original product strategy and differentiation. Zero copyrighted artwork, source code, brand assets, or exact layouts from competitors will be copied.

---

## 1. Reference Website Deep-Dive: `https://digitalbouquet.org/`

We audited `https://digitalbouquet.org/` end-to-end in a live headless Chromium browser across Desktop (`1440×900`) and Mobile (`390×844`, touch enabled), completing the full 5-step creation flow, generating a live share link (`/share/1ccf4ce57d`), and inspecting the recipient unboxing view.

### 1.1 Architecture, Homepage & Navigation
- **Site Map & Routes:** `/`, `/create`, `/create/color/{flowers,greenery,bouquet,card,share}`, `/create/gold/{flowers,greenery,bouquet,card,share}`, `/virtual-cake`, `/gallery` (plus 6 emotional lane guides and `/gallery/photobooth-online-girlfriend`), `/about`, `/terms`, `/privacy`, `/refund`.
- **Navigation Bar:** Brand mark (`Digital Bouquet` in script green) + pill links: `CREATE`, `GOLD BOUQUET`, `VIRTUAL CAKE`, `GALLERY`, `ABOUT`, `SIGN IN` (Clerk authentication).
- **Homepage Structure:**
  - **Heavy AdSense Intrusion Above the Fold:** A Google AdSense "Discover more" search-ad unit sits directly above the hero on `/`, `/create`, `/virtual-cake`, `/gallery`, `/about`, and `/refund`. Inline contextual ad chips (e.g., `[Send Flowers]`, `[Benchmark Pay]`) are injected directly inside editorial text and beside the wizard's `0/11 selected` counter. On `/gallery` and `/virtual-cake`, bottom sticky banner ads cover over half the viewport.
  - **Hero & Mini Preview:** Features an interactive 2-step teaser widget (`01 PICK FLOWERS`, `02 CHOOSE BUSH`, `CONTINUE`), followed by 6 curated mood gallery cards (`Soft Romance`, `Warm Gratitude`, `Quiet Apology`, `Bright Birthday`, `Gentle Miss You`, `Tender Encouragement`), "How it works" (4 steps), "Why Digital Bouquet", "When to send", and "Studio routes".
  - **Technical Observations:** Built on Next.js App Router with Clerk auth and Cloudflare/Vercel edge caching. Note: On mobile (`390×844`), the hero teaser pills truncate (`01 PI...`, `02 BU...`) and gallery images below the fold failed to render on initial paint.

### 1.2 Flower Selection Interface & Library
- **Flow:** Step 1 (`/create/color/flowers`) prompts *"Pick 6 to 11 blooms — You can repeat the same bloom to build the bouquet shape you want."*
- **Available Varieties (12 Total):**
  1. `Orchid` (white)
  2. `Tulip` (red)
  3. `Dahlia` (peach/blush)
  4. `Anemone` (purple)
  5. `Carnation` (pink)
  6. `Zinnia` (coral/orange)
  7. `Ranunculus` (peach)
  8. `Sunflower` (yellow)
  9. `Lily` (white/gold)
  10. `Daisy` (white)
  11. `Peony` (coral red)
  12. `Rose` (crimson)
- **Visual Fidelity:** Flat 2D watercolor/hand-illustrated isolated bloom heads (`/flower/*.webp`). No stems, no side-angle blooms, no bud variations, and no color variants per species (e.g., cannot choose a white rose or blue hydrangea).
- **Gold Mode (`/create/gold/flowers`):** Reuses the exact same 12 bloom heads with a monochrome gold/amber treatment and gold CTA buttons (`#E59A00` tone).
- **Interaction & Mobile Gaps:**
  - Clicking adds a bloom (up to 11 total) with a numeric badge and `-` decrement circle.
  - Flower names only appear on desktop mouse hover (`Sunflower`), leaving **mobile touch users with zero bloom labels** (`390×844`).
  - No search, color filtering, occasion tags, or floriography (flower meaning) tooltips during selection.

### 1.3 Greenery Selection
- **Interface:** Step 2 (`/create/color/greenery`) presents only **4 pre-bundled foliage + ribbon assets**:
  1. `Sage` (eucalyptus/fern mix with bright mint bow + red gem)
  2. `Olive` (olive branches/wheat with gold bow)
  3. `Eucalyptus` (mixed greens with green gingham bow)
  4. `Baby's Breath` (foliage/berries with burgundy velvet bow)
- **Weaknesses:**
  - Foliage, stems, and ribbon bow are baked into 4 static background images—users cannot customize ribbon color, material, or mix greenery stems.
  - Gold mode (`create/gold/greenery`) forces gold flowers onto the exact same bright green cartoon `Sage` foliage and mint ribbon, creating severe palette clashes.

### 1.4 Bouquet Composition, Positioning & Shape Selection
- **Interface:** Step 3 (`/create/color/bouquet`, labeled `SHAPE` on mobile and `BOUQUET` on desktop) provides **only two actions**:
  - `TRY A NEW ARRANGEMENT` (random algorithmic scatter)
  - `CHANGE GREENERY`
- **Empirical Drag-and-Drop Test:** Simulated mouse drag (`mousedown` → `mousemove +80px, +40px` → `mouseup`) confirmed **`moved: false`** — zero drag-and-drop exists.
- **Missing Controls:**
  - No drag-and-drop repositioning, no bloom scaling, no rotation, no z-index layering (front/back), no flip/mirror, and no undo/redo.
  - Overlapping collisions happen randomly (e.g., an orchid sitting directly on top of half a sunflower) with no way to manually adjust it.
  - **No bouquet shapes:** Despite the mobile label `SHAPE`, there are no silhouette modes (round hand-tied, cascade, airy garden, dome, single-stem, or ceramic/glass vases).

### 1.5 Card Customization, Personal Message, Photo & Voice Options
- **Step 4 (`/create/color/card`):** Three-column desktop layout:
  1. **Wrap Style (5 options):** `Blush`, `Kraft`, `Lilac`, `Mist`, `Sage` paper cones (note: wraps are NOT shown while composing in Step 3—only on Step 5!).
  2. **Envelope Style (6 options):** `Signature Note`, `Envelope` (airmail), `Gift` (holiday stockings), `Cute Love`, `Violet`, `Birthday` — inconsistent illustration styles across sets.
  3. **Live Preview & Message Inputs:**
     - Lined cream notepad with one blue handwriting font (`To Someone special, ... With love`). Zero font, ink color, or stationery texture choices.
     - Required fields: `RECIPIENT` (`Beloved,`), `MESSAGE` (`Keep it short, warm, and card-sized.` — hard limit `10 lines`), `SENDER` (`Secret Admirer`). `GENERATE` remains disabled until all 3 inputs are populated.
  4. **Background Music (6 tracks):** `MELANCHOLY`, `DIGITAL`, `VIOLIN`, `GLOW`, `GUITAR`, `SAXOPHONE`. Represented by incongruous bright arcade-style 3D button graphics that **fail to render visibly on mobile (`390×844`)**, leaving floating text labels above blank space.
  5. **Photo & Voice Gating (Major Expectation Gap):**
     - Homepage Step 3 promises *"Attach up to five photos and record a short voice message"*.
     - In reality, inside Step 4, **both "Add up to 5 photos" and "Personal Recording" are gated behind Clerk Sign-In** (`SIGN IN TO ADD PHOTOS`, `SIGN IN TO UPLOAD`).
     - Additionally, voice recording states *"Your first premium share is free"* — matching `/refund` policy documentation for **paid premium share credits**.
     - **YouTube Video (`FREE` badge):** Allows pasting a YouTube URL to append at the end of the letter.

### 1.6 Final Preview, Sharing & Recipient Unboxing
- **Step 5 (`/create/color/share`):**
  - Displays final bouquet inside wrap overlapping the closed envelope (stems/mint bow stick awkwardly over the envelope top).
  - Actions: `CREATE NEW`, `EXPORT GIF` (GIF only — no high-res PNG, JPG, 9:16 social story card, or PDF print), `OPTIONAL PIN` (sign-in gated), and `CREATE LINK`.
  - Clicking `CREATE LINK` fires `POST /api/share`, returning a short URL (`https://digitalbouquet.org/share/1ccf4ce57d`) with `COPY` and `SHOW QR` buttons. No native Web Share API, WhatsApp, iMessage, or Email shortcuts.
- **Recipient View (`/share/1ccf4ce57d`):**
  - **Confusing Copy:** Top headline reads *"Send a Digibouquet for someone special"* (sender-oriented!) instead of addressing the recipient (*"For Maya, from Alex"*).
  - **Weak Unboxing:** Closed envelope has no visual prompt (*"Tap to open"*). Clicking opens the flap and slides the lined note up halfway, **clipping the sender signature (`Alex`) inside the envelope** until the user clicks an unlabeled overlay (`aria-label="Read full letter"`).
  - **Critical Privacy & Social Preview Defect:** `<meta property="og:description">` outputs the private card message verbatim (`"Happy birthday! Hope today feels warm and bright."`), **spoiling the surprise in WhatsApp/iMessage link previews**, while `og:image` serves a generic static `/og.webp` rather than a rendered preview of the user's bouquet.
  - **Mobile Stepper Overflow:** Across every step at `390×844`, Step `5 SHARE` is clipped off the right viewport edge (`SHAF`).

---

## 2. Competitor Landscape Analysis (8 Platforms)

| Platform | Category | Primary Aesthetic | Creation Mechanics | Rich Media & Audio | Export & Sharing | Monetization / Friction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **digitalbouquet.org** *(Reference)* | Digital Bouquet Builder | Flat 2D watercolor blooms + cartoon foliage; AdSense-heavy | 5-step wizard; 12 blooms; 4 preset bushes; **random shuffle only** (no drag/scale/rotate) | Photos (5) & voice behind auth/credits; YouTube URL; 6 music tracks | Short share link, QR code, GIF export; static OG image + leaks message text | Heavy AdSense ads + Clerk login wall + "premium share credits" |
| **Digibouquet (`digibouquet.vercel.app`)** | Viral Original 2D Builder | Ultra-clean parchment paper, typewriter/script, color & B&W modes | 5-step flow; fixed grid/shuffle placement; zero ads | Text card only (no photo/voice/music) | Permanent link + public **Community Garden** gallery | 100% free, zero auth, Ko-fi tip jar |
| **theBouquet (`thebouquet.me`)** | Social Digital Bouquet Builder | Playful pastel gradient UI, celebration confetti | Curated flower picker, quick customization, instant build | Text message + Premium upgrades | Instant URL + QR code + **Blooms of Love** public gallery + local History | Freemium ("Get Premium" tier); 300k+ bouquets sent without login |
| **DigiBouquet Net (`digibouquet.net`)** | Content-Led 2D Builder | Warm botanical pastel blog + tool | 8 flowers (`Rose, Peony, Tulip, Daisy, Lily, Orchid, Camellia, Lotus`), card themes (`elegant, vintage, midnight, botanical`) | Text message only | Unique shareable link | 100% free, zero auth; drives organic traffic via floriography & etiquette guides |
| **DigiBouquet Space (`digibouquet.space`)** | Procedural 3D / AI Builder | Glossy rose-tinted SaaS studio | 9-step studio + **AI text-to-bouquet prompt**, procedural 3D WebGL petal physics, custom greens & wraps | Lossless harmonic soundscapes, voice notes ($1–$5 tiers), scheduled delivery | Eternal private link + **Live Open Tracking ("Echo")** + recipient emoji reactions | Freemium ($0 free; $2.99 / $5.99 / $9.99 tiers for audio/voice/echo) |
| **DigiFlower (`digiflower.net`)** | Split-Pane Live Builder | Neo-brutalist crisp cream/pastel cards with dark/light toggle | **Live split-screen builder** (controls left, real-time preview right); mood-bundled flower packs; EN/DE/TR i18n | Optional opening animation + background music | Shareable link; rich occasion SEO landing sections | 100% free, zero auth |
| **Flower Architect (`flowerarchitect.com`)** | Pro 3D Floral Design Tool | Skeuomorphic studio / 3D CAD | **1,700+ 3D flowers**, 32 view angles per stem, drag/scale/rotate/layering, containers/ribbons, **room photo backdrop** | N/A (visual design tool) | **PDF export with flower shopping/recipe list**, PNG image, Canva app integration | Freemium / Paid app subscription (mobile + desktop); steep learning curve for casual gifters |
| **Paperless Post (`paperlesspost.com`)** | Luxury Digital Stationery | Designer editorial stationery (Kate Spade, Rifle Paper Co.) | High-control card typography, paper textures, custom envelope liners, wax seals, stamps, backdrops | Photo frames, subtle envelope-open animation, RSVP guest management | Link, Email, SMS, open/read tracking | **"Coin" microtransaction system** (heavily criticized on Trustpilot for hidden per-feature costs) |
| **Kudoboard (`kudoboard.com`)** | Collaborative Group Cards | Clean pinboard / slideshow | Multi-contributor board (friends/coworkers post cards simultaneously) | Photos, GIFs, video uploads, milestone badges | Private web link, scheduled delivery, **slideshow mode**, physical book/poster printouts | Free mini-board limits; paid per-board / enterprise SaaS |
| **Jacquie Lawson (`jacquielawson.com`)** | Animated E-Cards | Hand-painted classic British storybook watercolor | Template message customization (minimal arrangement freedom) | Orchestral classical music + **cinematic animated mini-movies** | Email delivery / recipient gift pass | Annual subscription paywall; recurring mobile video/VPN playback complaints |

---

## 3. Key Strategic Insights & Takeaways

1. **The Visual Realism Vacuum:** Almost every consumer digital bouquet site (`digitalbouquet.org`, `digibouquet.vercel.app`, `digibouquet.net`, `thebouquet.me`) relies on **flat 2D clip-art/watercolor sprites** with visible black outlines, flat opacity, and unnatural overlapping collisions. Meanwhile, pro tools like **Flower Architect** deliver realism & 32-angle depth, but feel like complex CAD software rather than an emotional gifting experience. **Photorealistic studio-lit stems & blooms with natural shadow/depth layering inside an effortless consumer studio is our #1 visual differentiator.**
2. **The Composition Control Gap:** `digitalbouquet.org` forces users to mash *"Try a new arrangement"* hoping RNG fixes bad overlaps. True tactile joy comes from **curated floral templates ("Start Smart") PLUS direct manipulation (drag, rotate, scale, layer order, flip)** so users feel like an actual floral designer.
3. **Trust & Friction Killers:** Display ads inside an emotional love-letter flow (`digitalbouquet.org`) and opaque "Coin" paywalls (`Paperless Post`) ruin intimacy. Putting basic photo/voice features behind sudden login walls after promising them on the homepage erodes trust.
4. **Live Split-Pane Preview Wins:** `digiflower.net` and `digibouquet.space` prove users prefer seeing their bouquet evolve live as they pick flowers, greenery, wrap, and card—rather than waiting blindly until Step 3 or Step 5 (`digitalbouquet.org`) to see how their wrap looks on the bouquet!
5. **Recipient Experience Is Half the Viral Loop:** Every recipient who receives a bouquet is a potential new sender. A cinematic, bug-free envelope/ribbon unboxing animation, recipient-first personalized framing (*"Prepared for Maya by Alex"*), flower meaning cards, downloadable keepsake/wallpaper exports, and one-tap thank-you reactions create organic word-of-mouth virality.

