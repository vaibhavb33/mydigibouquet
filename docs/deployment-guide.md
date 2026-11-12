# Production Deployment & Operations Guide — Petal & Prose

---

## 1. Recommended Production Topology

Because serverless filesystems are ephemeral while **Petal & Prose** persists shared bouquets, studio drafts, keepsake photos/voice blobs, contact submissions, and daily analytics inside LibSQL/SQLite, production requires either:

1. **Managed Edge/Cloud Hosting + Persistent Turso LibSQL (Recommended):**  
   - **Compute:** Vercel / Fly.io / Railway (Node.js runtime, NOT Edge runtime, because `/api/og/[slug]` uses `@napi-rs/canvas` and `sharp` configured in `serverExternalPackages`).
   - **Database:** Managed **Turso** database (`DATABASE_URL=libsql://...`, `DATABASE_AUTH_TOKEN=...`).
2. **Single-Node VPS / Docker Container + Persistent Volume + Reverse Proxy:**  
   - Store `file:/var/lib/mydigibouquet/local.db` on an encrypted block volume with permissions **`0700`** on the directory and **`0600`** on the `.db` file owned exclusively by the unprivileged Node process user.
   - Terminate **TLS 1.2/1.3 (HTTPS)** cleanly at Caddy / Nginx / Cloudflare and set `ENABLE_HSTS=true`.

---

## 2. Pre-Deploy Build & Provisioning Sequence

1. **Configure Production Secrets:**
   Set `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `RATE_LIMIT_SALT` (`openssl rand -hex 32`), `NEXT_PUBLIC_ENABLE_ANALYTICS`, `ENABLE_HSTS=true`, and optional `GEMINI_API_KEY`.
2. **Apply Database Schema & Verify Migrations:**
   - Review [`drizzle/0000_lame_vance_astro.sql`](file:///Users/vaibhavborkar/mydigibouquet.com/drizzle/0000_lame_vance_astro.sql).
   - Push to Turso or local DB: `npm run db:push` (on remote Turso ensure LibSQL URL & auth token are exported, or initialize idempotently via `GET /api/health` on boot).
3. **Build Application:**
   ```bash
   npm ci
   npm run typecheck
   npm run build
   ```
4. **Verify Health & Live HTTPS Endpoints Immediately Post-Deploy:**
   ```bash
   curl -s https://mydigibouquet.com/api/health
   # Expected: {"ok":true,"status":"healthy","catalogCount":40,"storageMode":"remote-libsql",...}
   curl -I https://mydigibouquet.com/robots.txt
   curl -I https://mydigibouquet.com/sitemap.xml
   ```

---

## 3. Storage Permissions & File Safety

- **Media Attachments (`POST /api/media`):** Uploaded cropped photos (<= `4 MB` `image/jpeg|png|webp`) and voice recordings (<= `5 MB` `audio/webm|ogg|mp4|mpeg|wav`) are inspected via raw binary magic bytes (blocking disguised `<svg>`/`<?xml>`/`<html>` scripts) and persisted inside `media_attachments` rather than writable disk folders—preventing static web-shell uploads (`GET /api/media/[id]` always enforces `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'`, `X-Robots-Tag: noindex, nofollow`, and `Cache-Control: private, max-age=31536000, immutable`).
- **Local File Mode (`local.db` + `backups/`):** [`scripts/db-backup.mjs`](file:///Users/vaibhavborkar/mydigibouquet.com/scripts/db-backup.mjs) sets directory mode **`0700`** and archive file mode **`0600`**. Run `chmod 600 local.db` on any VPS deployment.

---

## 4. Backup & Disaster Recovery Plan

| Tier | Backup Mechanism | Frequency | Recovery Procedure |
|---|---|---|---|
| **Turso LibSQL (Prod)** | Native Turso Point-in-Time Recovery (PITR) + scheduled `turso db shell <db> .dump > dump.sql` to encrypted object storage | Continuous / Daily | Restore from PITR timestamp or execute `turso db create <recovered-db> --from-dump dump.sql` and rotate `DATABASE_URL` |
| **SQLite Single-Node** | Cron executing `npm run db:backup` ([`scripts/db-backup.mjs`](file:///Users/vaibhavborkar/mydigibouquet.com/scripts/db-backup.mjs)), copying `backups/*.db` off-host encrypted (`chmod 0600`) | Every 6 hours + pre-deploy | Stop Node service -> verify backup via `sqlite3 backup.db "PRAGMA integrity_check;"` -> replace `local.db` atomically -> start Node service |

**Tested Local Recovery Result:** `npm run db:backup` verified creation of a `401,408`-byte hot snapshot passing `PRAGMA integrity_check = ok` cleanly.

---

## 5. Production Security Posture Checklist

- **HTTPS / HSTS:** Reverse proxy / CDN TLS termination required in production + `ENABLE_HSTS=true` to emit `Strict-Transport-Security`.
- **Content-Security-Policy:** Production `next.config.ts` disables `'unsafe-eval'`, locks `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'`, and isolates media downloads cleanly.
- **CSRF & Rate Limiting:** All mutating endpoints check Same-Origin (`assertSameOrigin` returning HTTP `403` on cross-site `Origin`) and enforce HMAC-hashed IP sliding-window limits (`HTTP 429` + `Retry-After`).
- **Privacy Guarantee:** Private gift bouquets (`/b/<slug>`) return `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`, and stay isolated from `/gallery` and `/sitemap.xml`.

