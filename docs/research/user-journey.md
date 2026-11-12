# User Journeys & Experience Flows

**Prepared by:** Senior Product Research & Strategy Team  
**Date:** 2026-11-11  
**Target Viewports:** Desktop (`1280px–1440px`), Landscape Tablet (`1024px–1279px`), Portrait Tablet (`640px–1023px`), Mobile (`375px–639px`)

---

## Journey 1: First-Time Sender — "Build & Share a Bouquet in Under 2 Minutes"

### Entry Points
1. **Direct / Brand Visit (`/`):** Arrives on clean, ad-free editorial homepage → clicks `Create a Bouquet` or selects an Occasion Card (*e.g., Romance, Birthday*).
2. **SEO Search Visitor (`/occasions/[slug]` or `/flowers/[slug]`):** Reads occasion guidance or flower meaning → clicks `Customize This Bouquet in Studio` → enters `/studio?preset=apology` preloaded with matching wrap, card tone, and starter blooms, landing cleanly on **Step 2 (`Arrange & Wrap`)** with non-linear jumping enabled across all 4 steps.

### Step-by-Step Studio Flow (Split-Pane at `>=1024px`; Top Stage + Bottom Sheet on Mobile & Portrait Tablet)

Unlike `digitalbouquet.org` (which hides the wrap until Step 4/5 and gives zero placement control), **the bouquet canvas remains continuously accessible** across all studio steps (and auto-saves debounced drafts to `localStorage` so mobile tab reloads never lose work):

```
[1. Pick Blooms & Foliage] ──▶ [2. Arrange & Wrap] ──▶ [3. Write Card & Audio] ──▶ [4. Export & Share]
```

#### Step 1: Curate Stems & Foliage
- **User Sees:** Live vase/wrap base in the workspace (showing a subtle botanical guide silhouette when empty) + clean botanical drawer organized by **Focal Blooms**, **Fillers**, and **Foliage** with color filter pills (plus 1-tap `"Reset Filters"` if empty) and always-visible names + meaning badges (e.g., *"Peony — Warmth & Honor"*).
- **User Action:** Taps blooms (`+` / `-` stem counts, 3–15 stems; 1–5 allowed in `Minimalist`) or picks an *"Occasion Starter Mix"* (1-tap fills 7 balanced blooms).
- **System Feedback:** Each tapped bloom appears cleanly inside the selected arrangement silhouette on the live canvas with subtle spring entrance (or calm fade under `prefers-reduced-motion`) and a stem count indicator (`7 / 15 stems`). Adding a stem after manual arrangement inserts it into an open slot without wiping manual edits.

#### Step 2: Style, Wrap & Arrange
- **User Sees:** Calm live bouquet surrounded by lightweight arrangement tools:
  - **Shape Presets:** `Classic Round`, `Airy Garden`, `Cascading`, `Minimalist` (instant atomic undoable auto-rearrangement).
  - **Progressive Disclosure Direct Manipulation:** Only when tapping a stem (with pixel-alpha hit-testing) does the **Contextual Stem Inspector** appear (`44×44px` controls): drag `(x, y)`, rotate (`±45°` natural fan default), scale (`S/M/L` + slider), layer (`Bring Forward` / `Send Back`), flip, `"Cycle Overlapping Stem"`, duplicate, or delete. Undo/Redo always visible.
  - **Wrap / Vessel & Ribbon Tabs:** Toggle between Paper Wraps (*Blush Linen, Natural Kraft, Sage Cotton, Midnight Charcoal, Ivory Parchment*) or Vases (*Clear Glass Vase, Matte Cream Ceramic, Warm Terracotta*) + 6 Ribbon finishes.
- **Mobile & Portrait Tablet Adaptation:** Preview occupies top ~`45%` (mobile) to ~`52%` (portrait tablet) with `touch-action: none` on the stage; compact bottom dock + drawer sits cleanly below.

#### Step 3: Card, Stationery & Atmosphere
- **User Sees:** Side-by-side live tactile card + envelope preview at `>=1024px`. On mobile/portrait tablet, tapping a message input **collapses the bouquet canvas into a compact `"Tap to Peek Bouquet"` header chip** so the soft keyboard never obscures the stationery card.
- **User Action:**
  - Selects Card Paper (*6 styles*), Font Pairing (*4 styles*), Matching Envelope & Wax Seal (*6 finishes*).
  - Types `To` (optional), `Message` (with optional `"Inspire My Note"` prompt chips), and `From` (optional) — or skips text cleanly if exporting a visual-only `9:16` wallpaper.
  - Chooses optional **Ambient Soundtrack** (*Acoustic Guitar, Warm Piano, Gentle Strings, Garden Morning, Soft Vinyl, Silent*) with 1-tap preview playback.
  - *(V1.1 Fast-Follow)* Optionally attaches 1–3 Polaroid photos or records a 45s voice note directly in-browser.

#### Step 4: Preview, Export & Share
- **User Sees:** Complete composition preview + **`Preview As Recipient`** toggle (with persistent `"← Return to Studio"` pill; triggers zero read-receipt side-effects).
- **User Action:**
  - **Export Keepsake Image:** One-click high-res PNG/JPG downloads (`1:1 Square`, `9:16 Story/Wallpaper` with toggleable editorial colophon, `4:5 Card Portrait`), plus an in-app WebView `"Press & hold image to Save"` fallback modal if native Blob download is blocked.
  - **Create Share Link:** Clicks `Create Share Link` (no login required) → receives permanent 12-char base62 URL (`/b/[slug]`), 1-tap `Copy Link`, `QR Code`, `WhatsApp`, `Email`, and native `Share`, plus optional *"Hide names in link preview"* toggle.
  - *(V1.1)* Toggle optional 4-digit PIN & copy creator receipt link to see when opened.

---

## Journey 2: Recipient Unboxing — "From Messaging Link to Emotional Keepsake"

### Context
Recipient receives a link via WhatsApp, iMessage, Instagram DM, or Email on mobile (`~75%+` expected traffic) or opens on Desktop (`1440px` centered keepsake stage).

### Step-by-Step Experience
1. **Rich Messaging Link Preview (Privacy-Safe):**
   - Link card displays a pre-rendered `1200×630` visual thumbnail of the custom bouquet + title: *"Alex sent Maya a Digital Bouquet"* (or masked copy when *"Hide names"* / PIN lock is active) + teaser: *"Tap to untie the ribbon and read your note."* (Private message text is **never exposed** in link metadata.)
2. **Sealed Arrival State (`/b/[slug]`):**
   - Full-bleed calm tabletop surface, zero ads, zero clutter (`404` branded rescue page if link is invalid).
   - Personalized greeting with graceful fallback if names were omitted: *"For Maya, crafted with care by Alex"* (or *"Crafted with care for you"*).
   - Bouquet rests behind a softly sealed envelope/ribbon acting as a natural buffer until `image.decode()` and the single selected font pairing (`document.fonts.ready`) finish loading; clear cue: **`Tap to Open Your Bouquet`**.
   - If PIN-protected *(V1.1)*, clean 4-digit keypad unlocks the envelope server-side before hydrating letter/media.
3. **Interactive Unboxing Beat:**
   - Tapping synchronously inside the tap gesture:
     1. Triggers optional audio playback cleanly on iOS Safari via Web Audio `GainNode` (or hides audio controls completely if `Silent`).
     2. Envelope flap unseals / ribbon eases open (or `150–200ms` calm crossfade under `prefers-reduced-motion`).
     3. Full unclipped note card displays cleanly beside/above the bouquet (responsive floor + expandable full-letter view so signatures never clip) along with *(V1.1)* swipeable Polaroid photos or voice waveform player.
4. **Botanical Keepsake & Virality Loop:**
   - Recipient switches cleanly between **Full Bouquet View** and **Open Letter View** without hiding audio controls.
   - Expands **"Meaning of Your Blooms"** drawer to discover why Alex chose e.g. Peonies & Eucalyptus.
   - Actions at bottom:
     - `Save Keepsake Image` (with WebView long-press fallback).
     - *(V1.1)* `Send a Quick Thank-You` (1-tap heart/note back to Alex).
     - Prominent post-unboxing CTA: **`Send a Bouquet Back →`** (`/studio?replyTo=...` pre-filled with sender's name) to drive organic viral loops, plus subtle `Report Abuse` footer link.

---

## Journey 3: Organic Search Visitor — "Occasion & Floriography Discovery"

1. User searches Google for *"digital apology bouquet"* or *"what do peonies mean in a bouquet"*.
2. Lands on `/occasions/apology` or `/flowers/peony` (lightweight SSR editorial page with zero studio Canvas JS, zero ads, structured FAQ, crawlable message wording ideas, and real bouquet recipe examples).
3. Clicks **"Customize This Bouquet in Studio"** → jumps straight into `/studio?preset=apology` (canonicalized to `/studio`) landing cleanly on Step 2 with curated blooms, Kraft wrap, and gentle apology card tone preloaded—ready to personalize and share in 60 seconds.

