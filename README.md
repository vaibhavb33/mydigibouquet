# Petal & Prose — Bespoke Digital Flower Bouquet Atelier (`mydigibouquet.com`)

A full-stack digital floral creation platform built with **Next.js 15 (App Router)**, **React 19**, **TypeScript strict mode**, **Tailwind CSS v4**, **Konva.js**, and **LibSQL / SQLite (`drizzle-orm`)**.

---

## Core Capabilities

- **40 Morphological Botanical Stems (`3-LOD WebP + Bitmask Hit Testing`):** Roses (buds, half-open, full open), peonies, tilted tulips, ranunculus, anemones, sunflowers, lilies, phalaenopsis orchids, hydrangeas, baby's breath, silver eucalyptus, olive branches, ruscus, Monstera foliage, autumn oak, and pressed petals.
- **5-Step Composition Studio (`/studio`):**
  1. Select focal/filler flowers (`40` SKUs, searchable & palette-filtered)
  2. Layer greenery & airy fillers (`160px` off-screen alpha hitmasks + tray controls)
  3. Arrange stems manually (`Konva` 4-layer canvas, rotate/scale/mirror/z-order/lock, 30-step undo/redo, 7 florist silhouette presets, optional Gemini-enhanced AI Florist, Wrapping & Ribbon Studio)
  4. Customize stationery card (`6` paper templates, custom ink/paper polarity with auto-contrast guard, `6` cropped photos via binary magic-byte upload validation, inline `MediaRecorder` / audio file voice note)
  5. Final envelope preview, high-resolution PNG/JPG/transparent exports (`Canvas 2D`), QR print sheet, and privacy-scoped `/b/[slug]` share links (`isPublicShowcase` opt-in & `hideNamesInPreview` redaction).
- **Editorial & Botanical Discovery Routes:** `/`, `/flowers`, `/flowers/[species]`, `/occasions`, `/occasions/[slug]`, `/gallery`, `/blog`, `/blog/[slug]`, `/about`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`, plus `/robots.txt` & `/sitemap.xml`.
- **Production Hardening:** Same-origin CSRF enforcement, sliding-window HMAC-hashed rate limiting, magic-byte file inspection (`image/jpeg|png|webp`, `audio/webm|ogg|mp4|mpeg|wav`), cookieless DNT/GPC-honoring analytics (`/api/analytics`), branded runtime error boundaries, and hot SQLite backup tooling.

---

## Quick Start

```bash
cp .env.example .env.local
npm install
npm run typecheck
npm test
npm run build
npm run start
```

---

## Release & Engineering Documentation Index

| Document | Purpose |
|---|---|
| [Installation Guide](./docs/installation-guide.md) | Local machine prerequisites, asset pipeline build, database initialization & local verification |
| [Deployment Guide](./docs/deployment-guide.md) | Vercel + Turso / Node VPS provisioning, TLS/HTTPS setup, backup/restore DR plan & launch checks |
| [Environment Variables](./docs/environment-variables.md) | Complete specification of runtime & build-time environment variables and defaults |
| [API Documentation](./docs/api-documentation.md) | Reference for all 13 Route Handlers, security guards, validation limits & status codes |
| [Database Documentation](./docs/database-documentation.md) | Drizzle schema, SQLite/LibSQL WAL & foreign-key settings, migrations (`drizzle/`) & backups |
| [Testing Report](./docs/testing-report.md) | Full automated TypeScript, Vitest, Production Build, E2E Security & Performance benchmark ledger |
| [SEO Launch Checklist](./docs/seo-launch-checklist.md) | Technical SEO readiness sign-off & post-deploy Google Search Console / DNS steps |
| [Technical SEO Suite](./docs/seo/seo-audit.md) | Keyword research, site architecture, technical SEO checklist & editorial content calendar |

