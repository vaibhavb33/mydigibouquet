# Backend API Specification (`api-specification.md`)

**Version:** `1.1 (Peer-Reviewed & Security-Hardened — Next.js App Router Route Handlers)`  
**Runtime Policy:** **ALL** `/api/*` handlers touching LibSQL/SQLite, `@napi-rs/canvas`, `sharp`, or `StorageAdapter` declare `export const runtime = "nodejs";` and emit **`X-Robots-Tag: noindex, nofollow`** globally so API responses never appear in search results.

---

## 1. Global API Security, Headers & Error Standards

### 1.1 Standard JSON Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable calm explanation for UI banner",
    "fieldErrors": { "card.message": ["Message exceeds 14 printable lines"] },
    "retryAfterSeconds": 42
  }
}
```
- **Canonical Codes:** `VALIDATION_ERROR` (`400`), `UNAUTHORIZED` (`401`), `INVALID_PIN` (`401`), `PIN_REQUIRED` (`403`), `FORBIDDEN` (`403`), `NOT_FOUND` (`404`), `CONFLICT` (`409`), `PAYLOAD_TOO_LARGE` (`413`), `UNSUPPORTED_MEDIA` (`415`), `RATE_LIMITED` (`429` + HTTP `Retry-After`), `INTERNAL_ERROR` (`500`).

### 1.2 Global Request Hardening
- **Streaming Body Byte Cap (`413`):** Do not rely only on `Content-Length` (bypassable via `Transfer-Encoding: chunked`). Stream-read JSON bodies up to **`32768` bytes max** (`32 KB`), aborting immediately on overflow.
- **Unicode & "Zalgo" Protection:** Enforce `Intl.Segmenter` grapheme limits (`40` name / `600` message) **and** strict UTF-8 byte caps (`256` bytes name / `4096` bytes message) while stripping ASCII control chars and Unicode Bidi override chars (`U+202A..U+202E`, `U+2066..U+2069`).
- **Trusted Client IP & Keyed IP Hashing:** `getTrustedClientIp(req)` extracts exclusively platform-verified headers (`cf-connecting-ip`, `x-vercel-forwarded-for`, or single trusted proxy `x-real-ip`), explicitly ignoring arbitrary user-supplied `X-Forwarded-For` leftmost hops. Rate-limit keys and moderation deduplication store **`HMAC-SHA256(SERVER_IP_PEPPER, clientIp)`**.
- **CSRF Origin Guard:** Cookie-bearing mutations (`PATCH /api/preferences`, `POST /api/bouquets/[slug]/unlock`) and `multipart/form-data` mutations (`POST /api/media/voice`) require exact same-origin validation (`Origin` / `Sec-Fetch-Site === "same-origin"`), returning `403 FORBIDDEN` on cross-site form posts.
- **Timing-Safe Token Pattern:** Fetch record by `id` -> compute 32-byte `SHA-256` digest of presented token -> assert equal 32-byte `Buffer` lengths -> verify via `crypto.timingSafeEqual`.
- **HMAC-Signed Cookies:** Signed via `COOKIE_SIGNING_SECRET` (`HMAC-SHA256`), `HttpOnly`, `SameSite=Lax` (`Strict` on PIN unlock), `Secure` in production.

---

## 2. Core Endpoints (V1 Release Scope)

### 2.1 Botanical Assets & Templates (`GET /api/catalog`, `GET /api/templates`)

#### `GET /api/catalog` (`V1`)
- **Purpose:** Serves the **28** active `flower_assets` (SQLite, including `hasSpeciesPage` & `colorAnchor` -> `guideHref`), plus static manifest registries (`9` vessels with `supportsBow` & `allowedStemVisibility`, `5` bow styles, `6` ribbons, **`6` `audioTracks` (`{ id, label, m4aUrl, mp3Url }`)**, and **`8` Occasion Starter Presets** matching `birthday, anniversary, romance, apology, thank-you, sympathy, miss-you, get-well`).
- **Headers:** `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, `X-Robots-Tag: noindex, nofollow`.

#### `GET /api/templates` (`V1`)
- **Purpose:** Returns cleanly separated structures (`{ cardTemplates: CardTemplateDTO[], bouquetPresets: BouquetPresetDTO[], inspirePrompts: PromptStarterMap }`) covering the `6` DB stationery templates, `4` font pairings, `6` wax seals, curated homepage/gallery presets, and per-occasion `"Inspire My Note"` prompts.
- **Headers:** `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, `X-Robots-Tag: noindex, nofollow`.

---

### 2.2 Saving & Retrieving Bouquet Projects (`V1`)

#### `POST /api/projects` (`V1`)
- **Rate Limit:** `20 req / 10 min` per HMAC IP.
- **Request Body:** `{ title?: string, scene: BouquetSceneProjectInput }` — accepts **`0..15` stems** so early work-in-progress saves never error; verifies active catalog IDs, normalizes vessel/bow/visibility invariants, separates `card.templateId` cleanly to FK column `card_template_id` and persists `show_colophon` + `hide_names_in_preview` directly.
- **Response (`201 Created`, `no-store`):** `{ id, editToken, updatedAt }`.

#### `GET /api/projects/[id]` · `PUT /api/projects/[id]` (`V1`)
- **Auth:** `Authorization: Bearer <editToken>` matched cleanly against `edit_token_hash` via `timingSafeEqual` (`401` on mismatch).
- **Behavior:** `GET` returns reconstructed `{ id, title, scene: BouquetSceneV1, status, updatedAt }`. `PUT` runs transactional replacement of `bouquet_elements` (maintaining unique contiguous `0..N-1` `z_index`) and project columns (`40 req / 10 min`). Returns `400` with explicit field error if an old draft contains a retired (`is_active = 0`) SKU.

---

### 2.3 User Preferences (`V1`)

#### `GET /api/preferences` · `PATCH /api/preferences` (`V1`)
- Verified same-origin (`PATCH`), reads/updates signed `HttpOnly` `mydb_pref_token` cookie paired with `user_preferences` row (`tableSurfaceId`, `defaultShowColophon`, `preferredAudioMuted`). Fails gracefully if browser blocks cookies (`localStorage` remains functional).

---

### 2.4 Shareable Links, Dynamic Pre-Rendered OG & Moderation (`V1`)

#### `POST /api/bouquets` (`V1`)
- **Rate Limit:** `15 req / 10 min` per HMAC IP (`429` + `Retry-After`).
- **Request Body (Unified Across Docs):**
  `{ scene: BouquetSceneV1, sourceProjectId?: string, editToken?: string, mediaTokens?: Array<{ mediaId: string, uploaderToken: string }>, pin?: string }` (`pin` optional 4 numeric digits `\d{4}` in V1.1).
- **Authorization & Validation Pipeline:**
  1. If `sourceProjectId` is supplied, `editToken` is **mandatory**; verify against `bouquet_projects.edit_token_hash` (`401`/`403` IDOR block on missing/invalid match) before linking lineage or flipping project `status = 'published'`.
  2. Enforce stem count `[3..15]` (`[1..15]` when `arrangementTemplate === "minimalist"`), strict active allowlists (including 8 canonical `occasionTag`s), forced render normalization (`vase-*` forces `bowStyleId = "none"`, `Midnight Velvet` forces `paperTintId = "charcoal"` + dark ink), UTF-8 + `Intl.Segmenter` caps, **`wrapCardMessage` `<= 14` line ceiling (`400 VALIDATION_ERROR` `"Message exceeds 14 printable lines"`)**, and optional async `crypto.scrypt` PIN hashing (`N=16384, r=8, p=1`).
  3. **Synchronous Safe-Zone OG Pre-Render:** Generates `1200×630` JPEG using adaptive quality ladder (`q=88 -> 78 -> 70`) guaranteed strictly **`< 307200` bytes (`300 KB`)** (`630×630` centered safe zone, dark inks on `Slate`, zero message body, honoring `hideNamesInPreview`) via `@napi-rs/canvas` + bundled local fonts, writing `og/{slug}.jpg` to `StorageAdapter` **before** DB commit returns.
- **Response (`201 Created`, `no-store`):**
  ```json
  {
    "slug": "x8K2mPq9vL3n",
    "shareUrl": "https://mydigibouquet.com/b/x8K2mPq9vL3n",
    "ogImageUrl": "https://mydigibouquet.com/api/og/x8K2mPq9vL3n",
    "receiptToken": "raw_receipt_secret"
  }
  ```

#### `GET /api/bouquets/[slug]` (`V1`)
- **Privacy Headers:** `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`.
- **Moderation Guard:** Returns `404 NOT_FOUND` if missing or `moderation_status IN ('hidden', 'deleted')`.
- **PIN Guard (`V1.1`):** If `has_pin = 1` without a valid HMAC-signed slug+exp unlock cookie, strips `card.message`, `photos`, and `voiceUrl`, returning `{ slug, locked: true, publicTeaser: { recipientName?: string, senderName?: string, vesselId, stemCount } }` (both `recipientName` and `senderName` redacted cleanly when `hide_names_in_preview = 1`).
- **Unlocked Payload (`200 OK`):** `{ slug, locked: false, scene: BouquetSceneV1, media: SignedMediaDTO[], bloomMeanings: BloomMeaningDTO[], createdAt }` (`bloomMeanings` resolves historical SKUs **even if `is_active = 0`**).

#### `GET /api/og/[slug]` (`V1`)
- **Strict Non-Poisoning Response:** Verifies `moderation_status` directly from DB (`active` or `flagged` only). If missing OR `moderation_status IN ('hidden', 'deleted')`, immediately returns **true `HTTP 404` with `Cache-Control: no-store, max-age=0` and `X-Robots-Tag: noindex, nofollow`** (zero fallback image `200` poisoning).
- For active shares, streams cached `og/{slug}.jpg` (`< 300 KB` JPEG) with `ETag` and **`Cache-Control: public, max-age=300, must-revalidate`**.

#### `POST /api/bouquets/[slug]/open` (`V1`)
- Invoked once cleanly when human recipient taps `"Tap to Open Your Bouquet"` (never called during SSR bot unfurls or sender `"Preview As Recipient"`). Rate-limited (`30 req / 10 min` per HMAC IP); sets `first_opened_at` if null and increments `view_count`. Returns `204 No Content`.

#### `POST /api/report` (`V1`)
- **Rate Limit:** `5 req / 1 hour` per HMAC IP.
- **Body:** `{ slug: string, reason: "harassment" | "spam" | "inappropriate" | "other", details?: string (<=500 chars) }`.
- **Anti-Censorship & Dedupe Behavior:** Duplicate `(share_slug, reporter_ip_hash)` returns clean **`409 CONFLICT`** (*"You have already submitted a report for this bouquet"*). Distinct valid reports insert inside a transaction: `>= 3` sets `moderation_status = 'flagged'` (review alert); `>= 5` sets `moderation_status = 'hidden'` and **purges `og/{slug}.jpg`** cleanly from storage. Returns `201 Created`.

#### `GET /api/health` (`V1`)
- Executes lightweight non-mutating `SELECT 1` on LibSQL + read-only `StorageAdapter.headHealth()` check (`200 OK { ok: true }` or generic `503 { ok: false }` with zero leaked credentials/paths).

---

## 3. Authenticated Media & V1.1 Optional Endpoints

| Method & Path | Rate Limit | Security & Hardening Verification |
| :--- | :--- | :--- |
| **`POST /api/media/photos/upload-url`** | `12 / 10 min` | Accepts `{ contentType: "image/webp" \| "image/jpeg", byteSize <= 2097152 }`; signs exact `Content-Length` + `Content-Type` into short-lived R2 PUT URL (or HMAC-signed dev `/api/media/local-put` route); returns `{ mediaId, uploaderToken, uploadUrl }` w/ `24h` TTL. Client pre-shrinks `<= 5 MB` raw files cleanly via `<canvas>` to `<= 2 MB`. |
| **`POST /api/media/photos/commit`** | `20 / 10 min` | Calls `StorageAdapter.headObject()` before buffering; inspects buffer via `sharp`; explicitly **rejects any `format !== "jpeg" && format !== "webp"`** (`415`, blocking **SVG XSS**); **unconditionally re-encodes** `.rotate().resize(1600, 1600, { fit: "inside" }).webp({ quality: 86 })` without `.withMetadata()`, overwriting clean `media/photos/{uuid}.webp` and destroying all EXIF/XMP/polyglots! |
| **`POST /api/media/voice`** | `8 / 10 min` | Same-origin CSRF check; streaming `<= 4194304` byte cap; inspects magic headers (`ftyp` at **offset 4** restricted to safe major brands `M4A `, `M4B `, `mp42`, `isom`; MP3 `ID3` or frame sync `0xFFE0`; WebM `1A 45 DF A3`); parses exact duration in pure JS (`mvhd` / Xing / EBML) asserting `<= 45000ms`; writes non-executable `media/voice/{uuid}.{m4a\|mp3\|webm}` (`415` otherwise). |
| **`GET /api/media/[id]`** | `120 / min` | Authenticated streaming proxy (or signed R2 redirect) validating owning active share slug (`moderation_status === 'active'`) + valid unlock cookie when `has_pin = 1`; emits `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`, and exact safe audio/image `Content-Type`. |
| **`POST /api/bouquets/[slug]/unlock`** | `5 fails / 15 min` `(slug,IP)` + `25 / 1 hr` `slug` | Same-origin CSRF check; async `crypto.scrypt` PIN compare; wrong PIN returns `401 INVALID_PIN`; issues HMAC-signed `{ slug, exp }` `HttpOnly; SameSite=Strict` cookie (`30m`). |
| **`POST /api/bouquets/[slug]/echo`** | `5 / 1 hour` per IP | One-time thank-you reaction; duplicate returns **`409 CONFLICT`**; readable by sender at `GET /api/receipts/[token]` (`timingSafeEqual` token check + `X-Robots-Tag: noindex`). |
