# Recommended Differentiating Features & MoSCoW Roadmap

**Prepared by:** Senior Product Research & Strategy Team  
**Date:** 2026-11-11  
**Objective:** Define the concrete product innovations that elevate `mydigibouquet.com` far beyond `digitalbouquet.org` and legacy 2D bouquet clones while remaining intuitive for casual mobile senders.

---

## Strategic Differentiation Pillars

1. **Photorealistic Botanical Craft (No Clip-Art Look):** Studio-lit, transparent botanical photography/renders with realistic stems, depth shadows, natural wrapping folds, and zero harsh comic outlines.
2. **Guided Freedom ("Start Smart, Refine Freely"):** Beginners get instant gorgeous balance via 1-tap arrangement styles (*Classic Round, Airy Garden, Modern Minimal, Cascade*), while perfectionists can drag, rotate, scale, flip, and re-layer every single stem.
3. **Zero-Friction, Zero-Ad Intimacy:** Zero display ads anywhere in the studio or recipient experience. Zero mandatory sign-up wall to create, personalize, export, or share.
4. **Cinematic Unboxing & Two-Way Emotion:** Recipients don't just see a static image—they untie/open a tactile envelope, watch the bouquet bloom gently into view, read their letter + a *"Meaning of Your Blooms"* key card, and send back a heartfelt reaction.

---

## Feature Recommendations by MoSCoW Priority

### 1. MUST HAVE (V1 Launch Core — Non-Negotiable)

| ID | Feature | Description & Why It Wins |
| :--- | :--- | :--- |
| **M1** | **Photorealistic Botanical Library (28 V1 SKUs across Focal, Filler & Foliage)** | Studio-lit, shadow-free, alpha-decontaminated transparent WebP assets (`3-tier LODs`: thumb/studio/export) across **14 Focal Blooms** (species + select colorways), **6 Filler Blooms**, and **8 Foliage stems**. Includes always-visible mobile labels, color/occasion/meaning filters. |
| **M2** | **Interactive Hybrid Bouquet Canvas Engine** | Canvas-backed scene graph (`1000×1200` canonical world units) supporting: (a) **4 Arrangement Templates** (*Classic Round, Airy Garden, Cascading, Minimalist*); AND (b) **Direct Manipulation** — pixel-alpha hit-testing, 1-finger drag, `"Cycle Overlapping Stem"`, contextual stem inspector (rotate, scale, z-layer, flip, duplicate, delete), dynamic world-space shadows, & Undo/Redo. |
| **M3** | **Decoupled Wrap, Vessel & Ribbon Customizer** | Live-rendered in the main canvas: choose **Presentation Mode** (*Paper Wrap* in Blush Linen, Natural Kraft, Sage Cotton, Midnight Charcoal, Ivory Parchment; OR *Vase/Vessel* in Clear Glass Vase with water refraction/clipping, Cream Ceramic, Warm Terracotta) + 6 Ribbon styles. |
| **M4** | **Tactile Greeting Card & Stationery Studio** | Live card designer with 6 cohesive stationery themes (*Botanical Cream, Pressed Linen, Midnight Velvet, Deckle Cotton, Blush Parchment, Minimalist Editorial*), 4 metric-matched typography pairings, 6 matching envelopes + **Wax Seal** selector, recipient/sender fields (with graceful blank fallbacks), and occasion message starters. |
| **M5** | **Clean Ambient Audio Player (Desktop & Mobile Parity)** | 6 curated tracks (*Acoustic Guitar, Warm Piano, Gentle Strings, Garden Morning, Soft Vinyl, Silent*) using synchronous gesture-bound playback + Web Audio `GainNode` fades for iOS Safari compatibility, hiding player UI completely when `Silent`. |
| **M6** | **Deterministic Multi-Format Image Export** | Client-side high-DPI (`2x`/`3x`) PNG/JPG export in 3 ratios (`1:1` Keepsake, `9:16` Story/Wallpaper with subtle toggleable `mydigibouquet.com` colophon, `4:5` Printable Bouquet + Card), plus iOS WebView `"Long-Press to Save"` fallback. |
| **M7** | **Zero-Login Permanent Share Link, QR & Privacy-Safe OG** | Instant server-persisted 12-char base62 slug URL (`/b/[slug]`), Copy Link, QR code, and Web Share / WhatsApp / Email links. **Privacy-safe Node pre-rendered OG (`1200×630` JPEG/PNG `<300 KB`)**: renders bouquet visual + *"Alex sent Maya a bouquet"* (with optional *"Hide names"* toggle) and **never leaks private note text**. |
| **M8** | **Recipient Unboxing Reveal + Bloom Meaning Card + Reply Loop** | Recipient lands on an ad-free reveal page addressed to them (*"For Maya, from Alex"*), waits cleanly behind the sealed envelope until `image.decode()` + `document.fonts.ready`, taps `"Tap to Open Your Bouquet"`, reads the unclipped full letter, expands **"What Your Flowers Mean"**, and sees a prominent **"Send a Bouquet Back"** reply CTA. |
| **M9** | **Adaptive 4-Breakpoint Studio & Local Draft Auto-Save** | Adaptive layout across Mobile (`375–639px`), Portrait Tablet (`640–1023px`, top/bottom), Landscape Tablet (`1024–1279px`), and Desktop (`1280–1440px`), including Mobile Step-3 collapsible peek header for virtual keyboards and **debounced `localStorage` draft recovery** (promoted from V1.2!). |
| **M10** | **V1 Starter SEO Content & Legal Baseline** | Indexable starter hubs (`/occasions` + top 8 canonical occasion pages like `/occasions/apology`, `/flowers` + top 12 focal species pages, `/gallery` editorial showcase, `/about`, `/privacy`, `/terms`) with JSON-LD and canonical tags on `/studio`. |

---

### 2. SHOULD HAVE (High-Impact Differentiators for V1.1 / Launch Fast-Follow)

| ID | Feature | Description & Why It Wins |
| :--- | :--- | :--- |
| **S1** | **Frictionless Polaroid Photo Attachment (No Forced Login)** | Allow attaching up to 3–4 personal photos framed as polaroids tucked beside the bouquet (stored safely via pre-signed upload with moderation/size validation, no forced Clerk sign-up wall). |
| **S2** | **Browser Voice Note Recording (Zero Credit Paywall)** | Clean in-browser `MediaRecorder` voice note (up to 45s) with waveform preview and playback inside the recipient's card—delivering on the promise `digitalbouquet.org` paywalled. |
| **S3** | **Recipient Thank-You Echo & Read Notification** | Optional sender email or local link token letting the sender see *"Maya opened your bouquet"* and receive a 1-tap recipient emoji/note reply (*"Send a warm thank-you back"*). |
| **S4** | **Optional PIN / Passcode Lock** | Simple 4-digit passcode option generated on-share (no account required!) to protect intimate letters or photo attachments. |
| **S5** | **Expanded Occasion & Encyclopedia Long-Tail** | Expand V1's 8 occasions + 12 flower pages into the full seasonal calendar (`valentines-day`, `graduation`, `mothers-day`, `congratulations`, `friendship`, `just-because`) + all 28 botanical guides and i18n roadmap. |
| **S6** | **Smart Color Harmony & Florist Balance Tips** | Subtle non-blocking studio suggestions (e.g., *"Try adding Eucalyptus for airiness"* or *"Romantic Blush Palette"*) + 1-click *"Auto-Balance Bouquet"* cleanup button. |

---

### 3. COULD HAVE (V1.2 Growth & Engagement Boosters)

| ID | Feature | Description & Why It Wins |
| :--- | :--- | :--- |
| **C1** | **Animated Bloom / Petal Drift Unboxing** | Subtle CSS/Canvas motion on recipient load (gentle petal flutter, soft lighting shimmer, ribbon untie) with `prefers-reduced-motion` compliance and optional MP4/GIF export. |
| **C2** | **Collaborative Group Bouquet ("Multiple Senders Sign")** | Inspired by Kudoboard: a host creates a birthday/farewell bouquet and shares a contributor link so 5–20 teammates or friends can each add one stem + a signed mini-note to one shared bouquet. |
| **C3** | **Scheduled Future Delivery** | Pick a future date/timezone (e.g., midnight on an anniversary) and send an automated email/unlock link at that exact moment. |
| **C4** | **Cross-Device Account History Sync** | Optional magic-link account sync to view and manage previously sent bouquets across devices *(Note: single-device local draft autosave via `localStorage` is promoted to V1 `M9`)*. |
| **C5** | **Curated Scent & Mood Storytelling** | Atmospheric pairings (*"Morning Dew", "Candlelit Rosewater", "Summer Meadow"*) adjusting ambient canvas lighting, paper grain, and optional background particle mood. |

---

### 4. FUTURE ENHANCEMENTS (V2+ Platform Scale)

| ID | Feature | Description & Strategic Potential |
| :--- | :--- | :--- |
| **F1** | **WebGL / Interactive 2.5D Parallax Tilt** | Gyroscope / cursor parallax across depth layers (back foliage → mid stems → hero blooms → front wrap fold) for quasi-3D photorealism without heavy 3D CAD complexity. |
| **F2** | **AI Arrangement & Poetry Assistant** | Describe a recipient or memory (*"Apology for my best friend who loves autumn colors"*) → suggests flower recipe, palette, and non-cliché note drafts. |
| **F3** | **Print-at-Home Keepsake PDF & Physical Partner Fulfillment** | Printable high-res art poster / folded greeting card PDF, plus optional affiliate/local-florist bridge (*"Send this exact flower recipe as real stems"*). |
| **F4** | **B2B / Event & Wedding Floral Moodboards** | Exportable stem count & ingredient recipe sheets (inspired by Flower Architect) for brides and event planners. |

