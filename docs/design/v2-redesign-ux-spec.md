# Petal & Prose — v2.0 UI/UX Design & Dual-Mode Studio Specification

**Version:** `2.0`  
**Target Aesthetic:** Luxury European Floral Atelier (Warm Ivory `#F7F4EE`, Cotton `#FDFBF7`, Forest Atelier `#2D4739`, Dusty/Terracotta Rose `#8E4A49`, `Cormorant Garamond` Serif + `Plus Jakarta Sans`).

---

## 1. Navigation & Mode Entry Strategy (`/studio`)

### 1.1 Calm Global Studio Bar (Single Unified Row — Replaces Dual Stacked Top Bars)
Instead of two stacked top bars on desktop and mobile (`studio-desktop.png`, `studio-360w.png`):
- **Single Clean Header (`60px` desktop / `56px` mobile):**
  - **Left:** Compact `Petal & Prose` mark (`<Link href="/">`) + subtle draft indicator (`Saved`).
  - **Center:** Compact **Mode Segmented Switcher**: `Quick Create` (default) | `Advanced Studio` (`role="tablist"` pill).
  - **Right:** Secondary utility triggers (`My Bouquets` drawer, `Share` CTA button when ready) cleanly spaced — moving `AI Florist`, `Undo`, `Redo`, and editing tools into **contextual Mode B or assistant drawers** so beginners see calm clarity instead of tool overload.

---

## 2. Mode A: `Quick Create` (Default Experience for Everyday Senders)

**Goal:** A beginner crafts a studio-grade, gift-ready photorealistic bouquet in under 60 seconds with **zero intimidating sidebars, zero floating 9-button docks, zero x/y/rotation sliders**.

### 2.1 Five Clear Sequential Steps (`1` -> `2` -> `3` -> `4` -> `5`)
Compact horizontal stepper bar (`56px`) with clean readable labels (never truncated like `"3. Arran..."` on 360px mobile — uses concise icon+short label `Occasion`, `Style`, `Flowers`, `Card`, `Share`):

#### Step 1: **Choose Occasion**
- **Canvas Focus (Left/Center on Desktop `~58%`, Top Stage on Mobile):** Live full-bleed photorealistic bouquet preview over warm linen surface—reacts *instantly* with zero flicker as occasion cards are tapped.
- **Control Surface (Right Panel `~42%` / Bottom Sheet):**
  - Heading: *"What's the occasion?"*
  - Curated visual cards (`2-col` on desktop, `2-col` tap-friendly cards on mobile) featuring **11 core occasions** grouped cleanly: Top 6 highlighted first (*Birthday, Romantic, Anniversary, Thank You, Wedding, Friendship*), plus expandable *"More Occasions"* (*Congratulations, Valentine's Day, Mother's Day, Get Well, Apology, Sympathy, Miss You, Just Because*).
  - Each card shows color palette dots, warm tagline, and auto-applies curated blooms, wrap, ribbon, and stationery harmony (`applyOccasionTemplate(..., "full")`).
  - Single clear primary CTA: **`Continue to Style ->`**

#### Step 2: **Choose Bouquet Style**
- **Controls (Right Panel / Bottom Sheet):**
  - Section 1 — **Silhouette Shape (4–7 Visual Style Cards):** Focuses beginners cleanly on **Composition Styles** with plain-language floral descriptions (*Round Dome, Classic Hand-Tied, Romantic Asymmetric, Airy Garden, Premium Luxury, Minimalist, Wildflower*).
  - Section 2 — **Signature Wrapping or Vase (Curated 1-Tap Swatches):** Clean visual wrap/vase pills (*Kraft Paper, Blush Linen, Ivory Parchment, Sage Cotton, Textured Weave, Floral Wrap, Midnight Charcoal, Clear Glass, Ceramic, Terracotta, Bare Stems*) + automatic harmonious ribbon color (with optional one-row **Ribbon Color Strip**).
  - Section 3 — **Mood Backdrop (4 Surface Pills):** *Warm Linen, Limewash, Travertine, Evening Slate*.
  - Footer Nav: `<- Back` · **`Customize Flowers ->`**

#### Step 3: **Customize Flowers (or Keep Suggested Arrangement)**
- **Default State (Zero Overwhelm):** Shows the **"Curated for Your [Occasion]" Suggested Recipe** with a clean *"Chef's Recommendation"* strip displaying the active flowers as rich photographic mini-cards with intuitive **`− / count / +`** controls + a **"Regenerate Suggestion / Swap Mix"** pill + optional subtle *"Need ideas? Ask Atelier Florist"* link.
- **Simple Add/Swap Drawer:** Clean **4-chip filter** only (`All`, `Focal Blooms`, `Greenery`, `Delicate Fillers` — collapsing duplicate `Greenery & Fillers` / hidden `Petals` noise!) + quick color dots + clean search box.
- **One-Tap Auto-Arrange:** Adding or removing any bloom immediately re-balances the bouquet organically around the hand-tied collar!
- **Pro Escape Hatch:** Calm subtle footer link: *"Want to drag, rotate, or layer stems individually? Switch to Advanced Studio ->"*
- Footer Nav: `<- Back` · **`Personalize Card ->`**

#### Step 4: **Personalize Card**
- **Live Stationery Preview (Left/Center Stage):** Renders the bouquet beside/above the folded stationery card, updating typography, ink, paper tint, wax seal, and salutation cleanly as the user types.
- **Clean Focused Controls:**
  - *Recipient Name* (`"To"`), *Your Name* (`"From"`), *Personal Message* + **1-Tap Inspiration Starters** tailored to the selected occasion!
  - *"Bouquet only (no card note)"* toggle.
  - Progressive Accordion **"Card Paper, Wax Seal & Keepsake Extras"** (collapsed cleanly by default unless opened): Template & Paper Tint, Wax Seal Color, Font Style, Ambient Music Track, **Attach Keepsake Photos** (`PhotoCropperAttachment`), and **Record Voice Note** (`VoiceMessageRecorder`).
- Footer Nav: `<- Back` · **`Preview & Share ->`**

#### Step 5: **Preview & Share**
- **Split Finale Stage:**
  - Left: **Exact Recipient Preview** (rendered bouquet + card summary + **"Test Envelope Unboxing Reveal"** toggle using real wax seal animation!).
  - Right:
    1. **Share Private Link CTA (`Create Shareable Bouquet Link`)** -> Copy URL, WhatsApp Share, Mobile Share Sheet, Download QR Code, and Open Live Unboxing.
    2. **Privacy Toggles** (Clean inline checkboxes: *Animated Wax-Seal Reveal*, *Hide Names in Link Previews*, *Opt in to Public Gallery*).
    3. **Download Keepsake Image** (PNG / JPG across *Square 1:1*, *Editorial 4:5*, *Story 9:16*, *Transparent Cutout* — collapsed into clean format selector + single download buttons).

---

## 3. Mode B: `Advanced Studio` (Full Craft Workstation)

**Goal:** Give florists and perfectionists complete spatial creative power (`Konva` interactive stage) **without visual clutter**:

### 3.1 Simplified 3-Zone Architecture (`100dvh` Desktop, Single Sheet Mobile)
1. **Left Botanical Drawer (`300px`, collapsible toggle on laptop/tablet `<=1279px`):**
   - Clean Search + 4 crisp category tabs (`All`, `Focals`, `Greenery`, `Fillers & Petals`) + 6 color dots.
   - Crisp `2-col` photographic stem tiles showing larger bloom crops, plain English names (no awkward ellipses on main titles), 1-line meaning, and `+ / −` counters.
2. **Interactive Bouquet Stage (Center `flex-1`):**
   - Clean calm studio matte backdrop (**no intrusive graph-paper grid by default**; subtle optional toggle!).
   - Direct canvas click/drag/rotate/scale with `160px` pixel-alpha hitmasks and subtle dashed forest selection halo + top rotation handle.
   - **Streamlined Floating Action Pill (only appears cleanly when items are selected or undo exists!):**
     - **Idle state:** Compact `[Undo] [Redo] [Re-Arrange Shape] [Multi-Select]` (max 4 buttons — no 2-line 9-button clutter!).
     - **Selected state:** Compact contextual bar `[Forward] [Back] [Flip] [Lock] [Duplicate] [Delete]` right below/above canvas.
3. **Contextual Right Atelier Panel (`316px`, 4 focused tabs):**
   - **Tab 1 — `Stem & Layers`:** Active only when inspecting stems OR managing the clean drag/reorderable Layer Stack (`bringForward`, `sendBackward`, `swapVariation`, `flipX`, `lock`, `scale`, `rotation` readout).
   - **Tab 2 — `Wrap & Finish`:** Organized cleanly into **3 collapsible sections** (`Shape & Vessel`, `Ribbons & Stems`, `Surface & Recipes`) so the user never confronts 35 stacked buttons on one endless scroll.
   - **Tab 3 — `Card & Keepsakes`:** Full stationery, voice, and cropped photo controls.
   - **Tab 4 — `Export & Share`:** Same unified high-res PNG/JPG/Transparent exporter + private unboxing link generator.

### 3.2 Mobile (`360px` – `639px`) & Tablet (`640px` – `1023px`) Ergonomics
- Top bar fits comfortably inside `360px`: `[Petal & Prose]` + `[Quick | Pro]` compact toggle + `[Saved/Share]` icon button.
- Zero text clipping (`"Occasion · 1/5"` or clean 5 compact step pills wrapping cleanly if needed, max `36px` height).
- Interactive canvas stays `>= 42%` of viewport height at rest in Mode B, while Mode A lets the drawer scroll smoothly below a sticky compact live bouquet preview (`240px` tall pinned card on mobile) so mobile users ALWAYS see changes live while tapping occasions, styles, or flowers!

---

## 4. Public Pages & Homepage Refinements (`/`, `/flowers`, `/occasions`, `/gallery`)

- **Homepage (`/`):**
  - Keep approved typography (`Cormorant Garamond`, `Plus Jakarta Sans`), warm ivory `#F7F4EE`, `#2D4739` buttons, and section order (Hero, 6 Featured Occasions, Flower Collection Preview, 4-Step How It Works, Why Petal & Prose, Occasions, FAQ, Final CTA, Footer).
  - Update hero visual (`BouquetCanvasDisplay`) automatically with photorealistic botanicals + realistic linen wrap + silk bow.
  - Refine copy so `"40 Morphological stem assets"` becomes `"40 Botanical Stems"` and hero body replaces `"40 botanical SKUs"` with `"40 studio-lit stems—heirloom garden roses, full peonies, tilted tulips, eucalyptus, and delicate fillers"`.
  - Hero CTA copy points clearly into **Quick Create** (`"Create Your Bouquet"` -> `/studio`) plus subtle link option cleanly inside studio for Advanced Studio.
- **No Fake Testimonials:** Keep "Why Choose Petal & Prose" + "Curated Bouquets" crisp and honest with zero fabricated quotes.
