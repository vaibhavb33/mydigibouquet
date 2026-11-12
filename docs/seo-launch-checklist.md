# SEO Launch & Verification Checklist — Petal & Prose

**Scope:** Pre-launch technical implementation + post-deployment Search Console & DNS operational tasks.

---

## 1. Pre-Launch Codebase Readiness (Verified)

| Check | Status | Notes / Verification Reference |
|---|---|---|
| Unique `<title>` & concise pattern | **Passed** | `layout.tsx` uses `%s \| Petal & Prose`; `/` uses `titleAbsolute: true`; unique across all tested routes |
| Unique `<meta name="description">` | **Passed** | Hand-written descriptions on all static, SSG, and dynamic pages via `buildPageMetadata()` |
| Self-referencing canonical `<link>` | **Passed** | All indexable routes point cleanly to parameter-free `NEXT_PUBLIC_SITE_URL` canonicals |
| Parameterized `?` canonicalization | **Passed** | `/studio?...` & `/blog?category=...` emit `noindex, follow` + stripped base canonical |
| `/robots.txt` accessibility & blocks | **Passed** | Allows `/`, `/b/`, `/api/og/`; disallows mutating/private APIs & `/receipt/`; specifies `Sitemap:` |
| `/sitemap.xml` completeness | **Passed** | Lists canonical hubs, 14 occasions, 10 species (+ image XML), 7 articles; zero private `/b/` links or `?` params |
| Breadcrumbs + `BreadcrumbList` JSON-LD | **Passed** | Rendered via `<Breadcrumbs />` across all secondary hubs and article/species/occasion pages |
| Schema.org structured data | **Passed** | `Organization` + `WebSite` (`SearchAction` -> `/flowers?q=`) root; `WebApplication` on `/studio`; `FAQPage` strictly on `/faq`; `Article` on `/blog/[slug]` |
| Open Graph & Twitter/X cards | **Passed** | Valid `1200x630` dynamic/botanical OG previews + `summary_large_image` Twitter metadata |
| Privacy-scoped shared links (`/b/[slug]`) | **Passed** | Private bouquets enforce `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, name redaction, and `/gallery` exclusion |
| Nonexistent `/api/og/*` HTTP status | **Passed** | Unknown slugs return `HTTP 404` with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` |
| `trailingSlash: false` consistency | **Passed** | Configured in [`next.config.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/next.config.ts#L20) |
| Custom 404 & Error Boundaries | **Passed** | Branded root [`not-found.tsx`](file:///Users/vaibhavborkar/mydigibouquet.com/src/app/not-found.tsx), [`b/[slug]/not-found.tsx`](file:///Users/vaibhavborkar/mydigibouquet.com/src/app/b/[slug]/not-found.tsx), and React error boundaries |

---

## 2. Post-Deployment Launch Actions (Requires Live Domain & Accounts)

> **Important Release Honesty Note:** The items below depend on live domain hosting and Google Search Console ownership verification outside this local development workspace.

- [ ] **Set Production `NEXT_PUBLIC_SITE_URL=https://mydigibouquet.com`** in hosting environment and trigger fresh build so canonicals, `sitemap.xml`, `robots.txt`, and OG URLs emit the live HTTPS domain.
- [ ] **Verify Live Domain Over HTTPS:** Confirm TLS certificate validity and HSTS (`ENABLE_HSTS=true`).
- [ ] **Verify Ownership in Google Search Console (GSC):** Add Domain property via DNS TXT record (or HTML tag verification).
- [ ] **Submit XML Sitemap in GSC:** Submit `https://mydigibouquet.com/sitemap.xml` inside *Search Console -> Sitemaps* and confirm zero crawl errors.
- [ ] **Inspect Flagship URLs in GSC URL Inspection:** Test `/`, `/studio`, `/flowers`, `/flowers/rose`, `/occasions/birthday`, and `/blog/what-is-a-digital-bouquet-complete-guide` for clean mobile rendering and rich result eligibility.
- [ ] **Bing Webmaster Tools & Rich Results Test:** Validate `FAQPage`, `Article`, and `BreadcrumbList` via Google Rich Results Test post-launch.

