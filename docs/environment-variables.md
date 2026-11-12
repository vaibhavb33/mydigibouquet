# Environment Variables Reference — Petal & Prose

All environment variables are consolidated cleanly in [`.env.example`](file:///Users/vaibhavborkar/mydigibouquet.com/.env.example) and inspected safely at runtime via [`src/lib/env.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/src/lib/env.ts) (never logged or returned in API responses).

| Variable | Required? | Default (if unset) | Scope | Description |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Yes (Prod)** | `https://mydigibouquet.com` (`src/lib/seo.ts`) | Client + Server | Canonical origin used by [`sitemap.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/src/app/sitemap.ts), [`robots.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/src/app/robots.ts), `metadataBase`, canonical `<link>` tags, Open Graph URLs, and JSON-LD schemas. Must include `https://` without trailing slash. |
| `DATABASE_URL` | **Yes (Prod)** | `file:./local.db` | Server Only | LibSQL/SQLite connection URI. Local/single-node deployments use `file:/var/data/mydigibouquet.db`; production serverless deployments should use `libsql://<db>-<org>.turso.io`. |
| `DATABASE_AUTH_TOKEN` | Conditional | *(none)* | Server Only (Secret) | Required when `DATABASE_URL` uses remote Turso (`libsql://` or `https://`). Consumed directly by [`getDatabaseConfig`](file:///Users/vaibhavborkar/mydigibouquet.com/src/lib/env.ts#L7-L18). |
| `GEMINI_API_KEY` | Optional | *(none)* | Server Only (Secret) | Optional key for Google Gemini (`gemini-2.0-flash`) inside [`generateAiProposalsWithOptionalLlm`](file:///Users/vaibhavborkar/mydigibouquet.com/src/engine/ai-florist.ts#L385). When unset or offline, the platform cleanly uses its deterministic botanical florist engine (`ai-florist.ts`). |
| `RATE_LIMIT_SALT` | Recommended (Prod) | Ephemeral random hex per boot | Server Only (Secret) | HMAC-SHA256 salt used to hash incoming IPs inside [`checkRateLimit`](file:///Users/vaibhavborkar/mydigibouquet.com/src/lib/request-security.ts#L71). Persisted salt keeps rate-limit buckets consistent; raw IPs are never persisted to disk. |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Optional | `"true"` | Client + Server | Controls cookieless first-party aggregate event counting on [`/api/analytics`](file:///Users/vaibhavborkar/mydigibouquet.com/src/app/api/analytics/route.ts). Set `"false"` to disable completely. Even when `"true"`, requests carrying `DNT: 1` or `Sec-GPC: 1` are automatically skipped. |
| `ENABLE_HSTS` | **Yes behind TLS** | `"false"` | Build / Next Config | Set `"true"` in HTTPS production environments so [`next.config.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/next.config.ts#L4) emits `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`. Leave `"false"` during local `http://127.0.0.1` testing. |

> **Security Rule:** `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `local.db*`, and `backups/` so credentials and database snapshots are never checked into Git.

