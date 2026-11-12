# HTTP API Documentation — Petal & Prose

All Route Handlers live under `src/app/api/` and receive global `X-Robots-Tag: noindex, nofollow` (via `next.config.ts`). State-changing endpoints (`POST`/`PATCH`/`DELETE`) enforce **Same-Origin CSRF validation** (`HTTP 403` on cross-origin mismatch) and **sliding-window rate limits** (`HTTP 429` with `Retry-After`).

---

## 1. Operational Health & Telemetry

| Method & Route | Rate Limit | Request / Auth | Response (`2xx`) & Errors |
|---|---|---|---|
| `GET /api/health` | — | None | `200`: `{ ok, status: "healthy", catalogCount: 40, storageMode, analyticsEnabled }` · `500`: `{ ok: false, status: "unhealthy", error }` |
| `GET /api/analytics` | — | None (returns aggregate daily counts only; zero PII/slugs) | `200`: `{ privacyMode: "cookieless-dnt-gpc-honored", enabled, aggregates: [{ metricDate, eventName, count }] }` |
| `POST /api/analytics` | `120/min` | JSON `{ event }`. Automatically skips (`202` `{ recorded: false }`) if `DNT: 1` or `Sec-GPC: 1` | `202`: `{ recorded: true, event, metricDate }` · `400` unsupported event · `403` cross-origin |

---

## 2. Botanical Catalog & AI Florist

| Method & Route | Rate Limit | Request / Query | Response (`2xx`) & Errors |
|---|---|---|---|
| `GET /api/catalog` | — | Optional `?q=`, `?role=`, `?color=`, `?occasion=` | `200`: `{ items: BotanicalMeta[], total: number }` |
| `POST /api/assistant/suggest` | `25/min` | JSON `{ prompt?, occasion?, preferredStyle?, currentScene? }` (`prompt` truncated `400` chars) | `200`: `{ proposals: AiBouquetProposal[] }` (`3` fully editable scenes grounded against `ALLOWED_SKU_IDS`) |

---

## 3. Shared Bouquets & Dynamic OG Cards

| Method & Route | Rate Limit | Request / Auth | Response (`2xx`) & Errors |
|---|---|---|---|
| `GET /api/bouquets` | — | None (strictly filtered to `sample-*`, `pub-*`, or `isPublicShowcase: true`) | `200`: `{ items: GalleryRow[] }` |
| `POST /api/bouquets` | `30/min` | JSON `{ title?, scene }` validated against `validateAndNormalizeScene(..., { requirePublishMinStems: true })` | `201`: `{ slug, editToken, shareUrl, ogImageUrl, title }` (`pub-` prefix added only if `isPublicShowcase && !hideNamesInPreview`) · `422` validation failure |
| `GET /api/bouquets/[slug]` | — | Path `slug` (increments `viewCount`) | `200`: `{ slug, title, occasionTag, scene, viewCount, createdAt, updatedAt }` · `404` |
| `PATCH /api/bouquets/[slug]` | `30/min` | JSON `{ editToken, scene }` matched against stored SHA-256 `editTokenHash` | `200`: `{ slug, updatedAt, shareUrl, ogImageUrl }` · `401` / `403` / `404` / `422` |
| `GET /api/og/[slug]` | — | Node runtime PNG (`1200x630`). Redacts recipient/sender title when `hideNamesInPreview` is true | `200` (`image/png`, `private, no-store` + `noindex` on private slugs; `public, max-age=300` on showcases) · `404` on unknown non-preset slug |

---

## 4. Workspace Projects (`My Bouquets`)

Requires HTTP header `x-workspace-token` (`^[A-Za-z0-9_-]{16,128}$`), hashed with SHA-256 into `workspace_token_hash` before querying/writing.

| Method & Route | Rate Limit | Behavior | Response |
|---|---|---|---|
| `GET /api/projects` | — | Lists up to `50` non-deleted saved projects for token sorted by `updatedAt DESC` | `200`: `{ projects }` · `401` |
| `POST /api/projects` | `60/min` | Creates normalized draft snapshot `{ title?, scene, publishedSlug? }` | `201`: `{ project }` · `400` / `401` |
| `GET /api/projects/[id]` | — | Loads single project matching `id` (`^[A-Za-z0-9_-]{8,64}$`) + workspace hash | `200`: `{ project }` · `400` / `401` / `404` |
| `PATCH /api/projects/[id]` | `60/min` | Updates scene, derived title, and stem count | `200`: `{ project }` · `400` / `401` / `404` |
| `DELETE /api/projects/[id]` | `60/min` | Soft-deletes project (`deletedAt`) scoped to workspace token | `200`: `{ deleted: true, id }` · `401` / `404` |
| `POST /api/projects/[id]/duplicate` | `30/min` | Clones project scene cleanly (`title (Copy)`, fresh `publishedSlug: null`) | `201`: `{ project }` · `401` / `404` |

---

## 5. Keepsake Media & Contact Moderation

| Method & Route | Rate Limit | Validation Rules | Response |
|---|---|---|---|
| `POST /api/media` | `30/min` | `multipart/form-data` (`kind: "photo" \| "voice"`, `file`, `durationSec?`). Binary magic bytes reject XML/SVG/HTML spoofs (`photo <= 4 MB`, JPEG/PNG/WebP; `voice <= 5 MB`, WebM/OGG/M4A/MP3/WAV) | `201`: `{ id, url: "/api/media/[id]", kind, mimeType, sizeBytes, durationSec }` · `400` / `413` / `415` |
| `GET /api/media/[id]` | — | Streams binary media with HTTP `Range` (`206 Partial Content`) support for audio seeking. Sets `nosniff`, `CSP: default-src 'none'`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, immutable` | `200` / `206` · `400` / `404` |
| `POST /api/contact` | `10/min` | JSON `{ name (>=2 chars), email (valid), topic, bouquetRef?, message (>=10 chars) }`, sanitized via `sanitizeTextInput` | `201`: `{ received: true, id, createdAt }` · `400` / `403` / `429` |

