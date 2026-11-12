# SEO Information Architecture & Indexing Boundaries — Petal & Prose

## 1. URL Hierarchy & Route Map

```
/                                      [Priority 1.0] Primary Studio Showcase & Digital Bouquet Hub
├── /studio                            [Priority 0.9] Interactive Online Bouquet Maker (WebApplication Schema)
│   └── /studio?preset|occasion|stem=  [noindex, follow; canonical -> /studio]
├── /flowers                           [Priority 0.9] Filterable 40-Stem Botanical Index (+ ?q= SearchAction target)
│   └── /flowers/[species]             [Priority 0.8] 10 Curated Species Monograph Pages (SSG)
├── /occasions                         [Priority 0.9] 11 Core + Extended Occasion Hub
│   └── /occasions/[slug]              [Priority 0.85] 14 Tailored Occasion Style & Note Starter Pages (SSG)
├── /gallery                           [Priority 0.85] Public Showcase & Curated Starter Arrangements
├── /blog                              [Priority 0.85] Floral Gifting Journal (7 Content Categories)
│   ├── /blog?category=...             [noindex, follow; canonical -> /blog]
│   └── /blog/[slug]                   [Priority 0.75] Long-Form Editorial Guides (SSG + Article Schema)
├── /how-it-works                      [Priority 0.75] 5-Step Guided Workflow & Technical Craft Breakdown
├── /about                             [Priority 0.70] Brand Story & Genuine Craft Philosophy
├── /faq                               [Priority 0.75] Searchable Accordion FAQ (Authoritative FAQPage Schema)
├── /contact                           [Priority 0.50] Studio Feedback & Bouquet Moderation Desk
├── /privacy                           [Priority 0.40] Privacy Policy & Link Confidentiality Specs
├── /terms                             [Priority 0.40] Terms of Service & Licensing
└── /b/[slug]                          [Privacy-Aware Shared Bouquet Unboxing Route]
    ├── Private gift links (default)   [HTTP X-Robots-Tag: noindex, nofollow + Meta noindex + redacted preview]
    └── Opt-in public showcase (`pub-` / `sample-` w/ !hideNamesInPreview) [index, follow]
```

---

## 2. Anti-Thin-Page & Duplicate Content Policy

1. **Curated Species Consolidation (`/flowers/[species]`):**  
   Rather than generating 40 shallow pages (one per SKU such as `rose-crimson-bud`, `rose-crimson-half`, `rose-crimson-open`), variants share rich **10 species hubs** (`rose`, `peony`, `tulip`, `ranunculus`, `anemone`, `sunflower`, `lily`, `orchid`, `hydrangea`, plus filler/foliage families). Each page renders all botanical stages, directional views, floriography symbolism, and direct `/studio?stem=` CTAs.
2. **Studio & Blog Parameter Canonicalization:**  
   Entry deep-links like `/studio?occasion=birthday` or `/studio?preset=classic-romance` or `/blog?category=Flower%20Meanings` carry a clean self-referencing canonical pointing to the base path (`/studio` or `/blog`) alongside `<meta name="robots" content="noindex, follow">` so link equity consolidates cleanly without duplicate SERP bloat.
3. **Trailing Slash Enforcement:**  
   `trailingSlash: false` is configured in `next.config.ts`, preventing `/flowers/` vs. `/flowers` duplicate resolution.

---

## 3. Private vs. Public Shared Bouquet Indexing & Privacy Guardrails

Personal bouquets created by users often contain real names, intimate notes, private photos, and personal voice notes. Search privacy is enforced across **four independent layers**:

1. **Opt-In Schema & Studio Control (`src/engine/types.ts`, `InspectorAndFinishingPanel.tsx`):**
   - `BouquetSceneV1.isPublicShowcase` defaults strictly to `false`.
   - Senders can check **`Hide recipient & sender names in link previews & search tags`** (`hideNamesInPreview: true`), which automatically forces `isPublicShowcase` off.
2. **Slug Namespacing (`src/app/api/bouquets/route.ts`):**
   - Only explicitly opted-in showcase bouquets (`isPublicShowcase === true` AND `!hideNamesInPreview`) receive the `pub-` prefix (alongside editorial seeded `sample-` showcases).
   - Default private bouquets receive opaque unprefixed 8-character slugs.
3. **Database Gallery Scoping (`src/db/index.ts`):**
   - `getRecentGalleryBouquets()` queries **only** rows where `slug LIKE 'sample-%'`, `slug LIKE 'pub-%'`, or `scene_json LIKE '%"isPublicShowcase":true%'`. Private gifts never surface on `/gallery` or `sitemap.xml`.
4. **Crawlability + HTTP Headers + Metadata Redaction (`robots.ts`, `next.config.ts`, `b/[slug]/page.tsx`, `api/og/[slug]/route.ts`):**
   - `/robots.txt` intentionally keeps `/b/` and `/api/og/` **allowed** for crawling—blocking `/b/` in `robots.txt` would prevent bots from observing `noindex` directives if external URLs are linked on chat/forums.
   - All unprefixed `/b/[slug]` routes receive `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store` from `next.config.ts`, **plus** SSR `<meta name="robots" content="noindex, nofollow">`.
   - When `hideNamesInPreview` is active (or a bouquet is private), `<title>`, `og:title`, `twitter:title`, and `/api/og/[slug]` render `"A Bespoke Digital Bouquet"` without recipient or sender names.
   - Missing slugs on `/api/og/[slug]` return HTTP `404` (`Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`) instead of poisoning CDN caches with fallback `200` images.

---

## 4. Internal Linking Strategy

- **Top Navigation (`SiteHeader`):** Links clean anchor text to `/flowers`, `/occasions`, `/gallery`, `/blog` ("Journal"), `/how-it-works`, `/faq`, and primary `/studio` CTA across both desktop and collapsible mobile drawers.
- **Footer Hubs (`SiteFooter`):** Organized into Discover (`/studio`, `/flowers`, `/occasions`, `/gallery`, `/blog`), Craft & Atelier (`/how-it-works`, `/about`, `/faq`), and Studio Trust (`/contact`, `/privacy`, `/terms`).
- **Contextual Editorial Flywheel:** Every `/blog/[slug]` article cross-links dynamically to matching `/occasions/[slug]`, `/flowers/[species]`, `/studio`, and 3 related articles. Every `/flowers/[species]` links into matching `/occasions/[slug]` guides and `/studio?stem=...`.

