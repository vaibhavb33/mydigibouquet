# Technical SEO Verification Checklist — Petal & Prose

**Verification Policy:** Every box below maps to implemented files in `src/` and automated checks in `src/engine/__tests__/engine.test.ts` and `e2e/studio.spec.ts`.

| Check | Status | Implementation Detail |
|---|---|---|
| **Root `metadataBase` & `getSiteUrl()`** | Implemented | `src/lib/seo.ts` normalizes `NEXT_PUBLIC_SITE_URL` (`https://mydigibouquet.com` default) with zero `localhost` leaks in canonical URLs. |
| **Unique Page `<title>` & Length Discipline** | Implemented | `src/app/layout.tsx` uses `%s \| Petal & Prose`; `/` uses `titleAbsolute: true` and informational routes omit redundant brand suffixes to stay concise. |
| **Unique Meta Descriptions** | Implemented | All static, SSG (`[species]`, `[slug]`, blog posts), and dynamic routes set distinct, action-oriented meta descriptions via `buildPageMetadata()`. |
| **Self-Referencing Canonicals & Query Stripping** | Implemented | Every public route outputs `alternates.canonical`. `/studio?...` and `/blog?category=...` force canonical to base path + `noindex, follow`. |
| **XML Sitemap (`/sitemap.xml`)** | Implemented | `src/app/sitemap.ts` includes static canonical hubs, 14 occasions, 10 species guides + image URLs, and 7 editorial articles; excludes `/b/*` & `?` queries. |
| **`/robots.txt` Generation** | Implemented | `src/app/robots.ts` allows `/`, `/b/`, `/api/og/`; disallows `/api/projects/`, `/api/media/`, `/api/contact/`, `/api/assistant/`, `/api/bouquets/`, `/receipt/`; cites sitemap URL. |
| **Breadcrumbs UI + `BreadcrumbList` Schema** | Implemented | `src/components/ui/Breadcrumbs.tsx` renders accessible `<nav aria-label="Breadcrumb"><ol>` + `BreadcrumbList` JSON-LD across all 12 secondary & dynamic route templates. |
| **Open Graph & Twitter/X Card Tags** | Implemented | Complete `openGraph` (`title`, `description`, `url`, `siteName`, `type`, `1200x630` image) and `twitter` (`summary_large_image`) across all pages. |
| **Dynamic `/api/og/[slug]` HTTP `404` & Privacy** | Implemented | `src/app/api/og/[slug]/route.ts` renders preset/bouquet visuals for valid slugs, strips names when `hideNamesInPreview` is true, and returns HTTP `404` on nonexistent slugs. |
| **Structured Data (`JSON-LD`)** | Implemented | Root `layout.tsx` embeds `Organization` + `WebSite` (`SearchAction -> /flowers?q=`); `/studio` embeds `WebApplication`; `/faq` embeds `FAQPage`; `/blog/[slug]` embeds `Article`; subpages embed `BreadcrumbList`. All serialized cleanly via `serializeJsonLd()` escaping `<`. |
| **Heading Hierarchy & Accessibility** | Implemented | Single `<h1>` per route (`h1 -> h2 -> h3` without skipped levels); semantic `aria-label` landmarks; `alt` attributes on `<BotanicalImage>` and editorial covers. |
| **Trailing Slash Policy** | Implemented | `trailingSlash: false` enabled in `next.config.ts`. |
| **Private Shared Bouquet Safeguards** | Implemented | Private `/b/[slug]` enforces `noindex, nofollow`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`, preview name redaction toggle in Studio Step 5, and exclusion from `/gallery` and `sitemap.xml`. |
| **Core Web Vitals Discipline** | Implemented | Font `display: "swap"`, Studio-only calligraphic font scoping, WebP multi-LOD assets, `aspect-[5/6]` CLS prevention, zero Konva script on `/`, and zero third-party ad trackers. |

