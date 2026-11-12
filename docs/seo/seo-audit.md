# Technical & On-Page SEO Audit — Petal & Prose (`mydigibouquet.com`)

**Audit Date:** 2026-11-11  
**Stack Audited:** Next.js 15 App Router, React 19, TypeScript Strict Mode, SQLite/LibSQL (`drizzle-orm`), Konva Canvas Studio (`src/components/studio/*`), Canvas 2D / Sharp Image Pipeline.

---

## 1. Executive Summary

Prior to this technical SEO engagement, the **Petal & Prose** platform had strong core application architecture and clean SSR routes, but lacked search discovery infrastructure, social metadata uniformity, editorial content depth, parameter canonicalization, and privacy-scoped indexing boundaries on shared gift routes.

All critical and high-priority technical SEO items identified in the pre-audit have now been engineered directly into the Next.js codebase and verified via automated checks.

---

## 2. Findings & Remediations

| Area | Pre-Optimization Gap Found | Remediation Implemented | Codebase Location |
|---|---|---|---|
| **Crawl Directives** | No `robots.txt` route existed; crawlers had no explicit sitemap reference or private API disallow list. | Added dynamic Metadata Route handler generating `/robots.txt` with `Sitemap` pointer, `Disallow` rules for private/mutating APIs (`/api/projects/`, `/api/media/`, `/api/contact/`, `/api/assistant/`, `/api/bouquets/`, `/receipt/`), while intentionally keeping `/b/` and `/api/og/` crawlable so search engines can read `noindex` directives. | `src/app/robots.ts` |
| **XML Sitemap** | No `/sitemap.xml` existed for static hubs, species guides, occasions, or blog posts. | Added Metadata Route handler generating `/sitemap.xml` covering `/` (`1.0`), `/studio`, `/flowers`, `/occasions`, `/gallery`, `/blog`, `/how-it-works`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, all 14 canonical occasions, all 10 curated species pages (with image URLs), and all 7 editorial posts—strictly excluding `/b/*` shared links and query URLs. | `src/app/sitemap.ts` |
| **Root Domain & Default Social Cards** | `src/app/layout.tsx` defaulted `metadataBase` to `http://localhost:3000` and lacked site-wide Open Graph, Twitter/X, `Organization`, and `WebSite` JSON-LD schemas. | Upgraded `layout.tsx` to use `getSiteUrl()` (`NEXT_PUBLIC_SITE_URL` fallback `https://mydigibouquet.com`), full OG/Twitter card defaults, and injected XSS-safe (`<` escaped as `\u003c`) `Organization` and `WebSite` (`SearchAction` targeting `/flowers?q={search_term_string}`) schemas. | `src/app/layout.tsx`, `src/lib/seo.ts`, `src/app/flowers/page.tsx` |
| **Route-Level Titles, Canonicals & Social Tags** | Subpages defined partial static metadata without canonical URLs, `openGraph`, `twitter` cards, or keyword mapping, and several titles triggered `"Brand \| Brand"` duplication via root layout template. | Created `buildPageMetadata()` helper in `src/lib/seo.ts` enforcing unique `<title>` lengths (using `titleAbsolute` on `/` to prevent duplicate brand suffix), unique descriptions, self-referencing `<link rel="canonical">`, `max-image-preview:large`, OG images, and `summary_large_image` Twitter cards across all pages. | `src/lib/seo.ts`, all `src/app/**/page.tsx` |
| **Parameterized Studio & Filter Duplicate Prevention** | `/studio?preset=...`, `?occasion=...`, `?stem=...`, and `/blog?category=...` lacked parameter-stripped canonicals or `noindex, follow` rules, risking duplicate URL indexation. | Converted `src/app/studio/page.tsx` and `src/app/blog/page.tsx` to async `generateMetadata`: clean `/studio` and `/blog` index cleanly (`index, follow` + `WebApplication` JSON-LD on `/studio`), while parameterized filter views emit `robots: noindex, follow` with clean canonical (`/studio` or `/blog`). | `src/app/studio/page.tsx`, `src/app/blog/page.tsx` |
| **Breadcrumbs & Schema Markup** | Only 2 subpages had raw `<nav>` breadcrumbs without `BreadcrumbList` structured data. Only `/faq` had JSON-LD. | Created reusable `<Breadcrumbs />` emitting semantic `<ol>` markup plus `BreadcrumbList` JSON-LD across all secondary routes (`/flowers`, `/flowers/[species]`, `/occasions`, `/occasions/[slug]`, `/gallery`, `/blog`, `/blog/[slug]`, `/about`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`). Preserved `FAQPage` strictly on `/faq` and added `Article` schema on `/blog/[slug]`. | `src/components/ui/Breadcrumbs.tsx`, `src/lib/seo.ts`, `src/app/faq/page.tsx`, `src/app/blog/[slug]/page.tsx` |
| **Private Shared Bouquet Leak (`/gallery`, `/b/[slug]`, `/api/og`)** | 1) `getRecentGalleryBouquets()` fetched all database rows, risking private recipient bouquets appearing on `/gallery`. 2) `hideNamesInPreview` still emitted recipient names inside `/b/[slug]` `<title>`/`og:title` and `/api/og/[slug]` images. 3) Missing `/api/og/*` slugs returned fallback `200` instead of HTTP `404`. | 1) Added explicit `isPublicShowcase` opt-in boolean in schema/Studio UI (default `false`); `getRecentGalleryBouquets()` now strictly queries `sample-%`, `pub-%`, or `"isPublicShowcase":true`. 2) `/b/[slug]` enforces `noindex, nofollow` + redacted `"A Bespoke Digital Bouquet"` title/OG/OG-image whenever `hideNamesInPreview` is true or bouquet is private. 3) Missing slugs on `/api/og/[slug]` return `HTTP 404` with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. | `src/db/index.ts`, `src/engine/types.ts`, `src/engine/validation.ts`, `src/app/api/bouquets/route.ts`, `src/app/b/[slug]/page.tsx`, `src/app/api/og/[slug]/route.ts`, `next.config.ts` |
| **Editorial Content Hub Gap** | Platform had product, occasion, and flower pages but zero informational blog articles targeting gifting ideas, flower meanings, or card writing queries. | Built `/blog` index + `/blog/[slug]` SSG article system (`src/lib/blog-posts.ts`) with 7 complete articles mapped 1:1 to editorial categories and linked cleanly from `SiteHeader` and `SiteFooter`. | `src/lib/blog-posts.ts`, `src/app/blog/*`, `SiteHeader.tsx`, `SiteFooter.tsx` |
| **URL Trailing Slash Consistency** | `next.config.ts` did not explicitly lock `trailingSlash: false`. | Enforced `trailingSlash: false`, API `X-Robots-Tag: noindex, nofollow`, and scoped `/b/` `noindex` vs showcase headers inside `next.config.ts`. | `next.config.ts` |

---

## 3. Core Web Vitals & Technical Performance Assessment

1. **Largest Contentful Paint (LCP):**
   - Homepage (`/`) and editorial routes render immediately via Server Components with zero heavy Konva bundle downloaded outside `/studio`.
   - Botanical imagery uses compiled transparent WebP assets sized per surface (`thumb` for cards, `studio` for canvases/species headers, `export` exclusively during hi-res client PNG/JPG generation).
   - Above-the-fold hero bouquet stage reserves exact `aspect-[5/6]` dimensions (`BouquetCanvasDisplay.tsx`) with instant skeleton placeholder prior to draw completion.

2. **Cumulative Layout Shift (CLS):**
   - Root fonts (`Cormorant_Garamond` and `Plus_Jakarta_Sans` in `src/lib/fonts-base.ts`) configure `display: "swap"` and Next.js font CSS variables, while heavy calligraphy/literary stationery fonts (`Alex_Brush`, `Lora`) load strictly on `/studio` and `/b/[slug]` routes.
   - Explicit `width`/`height` props and `aspect-square` / `aspect-[5/6]` wrappers lock box dimensions across flower thumbnails, gallery previews, and hero canvases.

3. **Interaction to Next Paint (INP):**
   - Zero third-party ad scripts, behavioral analytics wrappers, or render-blocking synchronous popups exist across any route.
   - Studio canvas interactivity isolates Konva drag state onto `ActiveDragLayer` + precomputed `160px` bitmask hit testing, preventing full-stage redraw stalls.

