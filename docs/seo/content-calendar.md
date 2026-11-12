# Organic Content Strategy & Editorial Calendar — Petal & Prose Journal (`/blog`)

**Editorial Objective:** Build topical authority across all 7 organic gifting pillars—**Digital Gifting**, **Flower Meanings**, **Bouquet Ideas**, **Birthday Messages**, **Anniversary Gifts**, **Virtual Flowers**, and **Digital Greeting Inspiration**—while funneling readers cleanly into contextual `/occasions/[slug]`, `/flowers/[species]`, and `/studio` journeys.

---

## 1. Phase 1: Published Foundation Articles (Live on `/blog`)

Every pillar launches with a structured guide containing semantic headings (`h1 -> h2`), actionable tips, `Article` JSON-LD schema, WebP botanical photography with descriptive `alt` text, and direct links into matching Studio templates and Species monographs.

| Category | Live Slug | Title | Target Keyword | Linked Funnel Targets |
|---|---|---|---|---|
| **Digital Gifting** | `/blog/what-is-a-digital-bouquet-complete-guide` | How to Create a Digital Bouquet That Feels Like Real Floristry | `create a digital bouquet` | `/occasions/just-because`, `/flowers/peony`, `/studio` |
| **Flower Meanings** | `/blog/flower-meanings-guide-for-custom-bouquets` | The Floriography Handbook: Flower Meanings for Personalized Bouquets | `personalized digital bouquet` | `/occasions/romance`, `/flowers/rose`, `/studio` |
| **Birthday Messages** | `/blog/25-thoughtful-birthday-bouquet-message-ideas` | 25 Thoughtful Birthday Bouquet Message Ideas (Beyond 'Happy Birthday') | `online birthday bouquet` | `/occasions/birthday`, `/flowers/sunflower`, `/studio` |
| **Anniversary Gifts** | `/blog/modern-anniversary-digital-flower-gifts` | Modern Anniversary Digital Flower Gifts: Recreate Wedding Blooms Online | `digital flower gift` | `/occasions/anniversary`, `/flowers/orchid`, `/studio` |
| **Bouquet Ideas** | `/blog/floral-arrangement-ideas-round-hand-tied-garden-luxury` | Online Flower Arrangement Silhouettes: Round, Garden, Sculptural & Luxury | `online flower arrangement` | `/occasions/wedding`, `/flowers/ranunculus`, `/studio` |
| **Virtual Flowers** | `/blog/why-virtual-flowers-with-voice-notes-feel-personal` | Virtual Flowers With Voice Notes & Cropped Photos: Why Multimedia Gifts Land Deeply | `virtual flower bouquet` | `/occasions/miss-you`, `/flowers/anemone`, `/studio` |
| **Digital Greeting Inspiration** | `/blog/virtual-greeting-cards-vs-digital-bouquet-unboxing` | Virtual Greeting Cards Upgraded: Inside the Animated Wax-Seal Envelope Experience | `virtual greeting cards` | `/occasions/thank-you`, `/flowers/hydrangea`, `/studio` |

---

## 2. Phase 2 & Phase 3 Editorial Roadmap (Upcoming Quarters)

| Publish Window | Content Category | Proposed Title | Target Query Focus | Primary Funnel Link |
|---|---|---|---|---|
| **Month 1 — Week 1** | **Flower Meanings** | *Roses, Peonies, and Olive Branches: Choosing Intentional Greenery & Buds* | rose bud meaning floriography, apology flower symbols | `/occasions/apology`, `/flowers/rose` |
| **Month 1 — Week 3** | **Digital Greeting Inspiration** | *What to Write Inside a Thank-You Bouquet Card for Teachers, Mentors & Hosts* | thank you flower card messages | `/occasions/thank-you` |
| **Month 2 — Week 1** | **Bouquet Ideas** | *Paper vs. Glass: Styling Kraft Linen, Velvet Ribbons & Transparent Vases* | how to wrap a flower bouquet style guide | `/studio`, `/gallery` |
| **Month 2 — Week 3** | **Virtual Flowers** | *How to Send Instant Long-Distance Care Bouquets Across Time Zones* | long distance virtual flowers free | `/occasions/get-well-soon`, `/occasions/friendship` |
| **Month 3 — Week 1** | **Anniversary Gifts** | *Zero-Waste Keepsakes: Exporting Phone Wallpapers & Framed Bouquet Prints* | save digital bouquet wallpaper high resolution | `/studio`, `/how-it-works` |
| **Month 3 — Week 3** | **Birthday Messages** | *Milestone 21st, 30th & 50th Birthday Bouquets: Color Palettes & Stationery Notes* | milestone birthday bouquet wishes | `/occasions/birthday`, `/occasions/congratulations` |

---

## 3. On-Page Article Publishing Standard

Before any new post is added to `src/lib/blog-posts.ts`, verify:
1. Unique slug, concise `<title>` (< 62 characters pre-suffix or fitting template cleanly), and descriptive meta description.
2. Exact 1:1 category assignment from `BlogCategory` union so `/blog?category=` filter tabs stay balanced without orphan tags.
3. Validated botanical WebP cover asset + human-written `coverAlt` text.
4. Both `relatedOccasion` and `relatedSpecies` mapped cleanly to live routes inside `/occasions/` and `/flowers/`.
5. Automated test coverage inside `src/engine/__tests__/engine.test.ts` confirming slug uniqueness and valid asset paths on disk.

