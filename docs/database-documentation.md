# Database Documentation — Petal & Prose

**Engine:** SQLite / Turso LibSQL via `@libsql/client` (`0.15.15`) + `drizzle-orm` (`0.44.5`)  
**Schema Source:** [`src/db/schema.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/src/db/schema.ts)  
**Client & Bootstrap:** [`src/db/index.ts`](file:///Users/vaibhavborkar/mydigibouquet.com/src/db/index.ts)  
**Generated SQL Migrations:** [`drizzle/0000_lame_vance_astro.sql`](file:///Users/vaibhavborkar/mydigibouquet.com/drizzle/0000_lame_vance_astro.sql)

---

## 1. Table Catalog (`5` Tables)

| Table Name | Purpose | Key Columns & Constraints |
|---|---|---|
| **`bouquets`** | Immutable published shared bouquets served at `/b/[slug]` and seeded showcases (`sample-*`) | `slug` (PK), `title`, `occasion_tag`, `scene_json` (validated `BouquetSceneV1` JSON), `edit_token_hash` (SHA-256), `view_count`, `created_at`, `updated_at`, `deleted_at` (soft-delete) |
| **`bouquet_projects`** | Mutable studio workspace drafts under `"My Bouquets"` | `id` (UUID PK), `workspace_token_hash` (SHA-256), `title`, `occasion_tag`, `stem_count`, `scene_json`, `published_slug`, `created_at`, `updated_at`, `deleted_at`; indexed by `idx_projects_workspace (workspace_token_hash, updated_at)` |
| **`media_attachments`** | Uploaded cropped keepsake photos and voice recordings referenced by `/api/media/[id]` | `id` (base64url random 16 chars PK), `kind` (`photo` \| `voice`), `mime_type` (magic-byte verified), `size_bytes`, `duration_sec`, `data_base64`, `created_at` |
| **`contact_messages`** | Support feedback, bug reports, and shared-bouquet moderation removal requests | `id` (UUID PK), `name`, `email`, `topic`, `bouquet_ref`, `message`, `created_at` |
| **`analytics_daily`** | Cookieless, PII-free daily feature adoption counters | `id` (`YYYY-MM-DD:<event_name>` PK), `metric_date`, `event_name`, `count`, `updated_at` |

---

## 2. Privacy & Access Isolation Design

1. **Token Hashing:** Raw browser edit tokens (`editToken`) and anonymous workspace keys (`x-workspace-token`) are never persisted in plaintext—only irreversible SHA-256 digests (`hashEditToken`) reside in SQLite.
2. **Public Gallery Filtering:** [`getRecentGalleryBouquets`](file:///Users/vaibhavborkar/mydigibouquet.com/src/db/index.ts#L131) restricts queries strictly to `slug LIKE 'sample-%'`, `slug LIKE 'pub-%'`, or `"isPublicShowcase":true` with `deleted_at IS NULL`, keeping private bouquets inaccessible from public gallery listings.
3. **Zero PII in Analytics:** `analytics_daily` aggregates daily integer counts per whitelisted UI action (`studio_opened`, `export_png`, `bouquet_published`, etc.) with zero IP addresses, user-agents, or bouquet identifiers.

---

## 3. Connection Settings & Migrations

- **Local SQLite (`file:`):** [`ensureDbReady`](file:///Users/vaibhavborkar/mydigibouquet.com/src/db/index.ts#L31) applies `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;` for concurrent read/write safety, idempotently creates missing tables/indexes, and seeds `4` editorial starter showcases (`sample-classic-romance`, etc.).
- **Remote Turso (`libsql://`):** Reads `DATABASE_URL` + `DATABASE_AUTH_TOKEN` via `getDatabaseConfig()`.
- **CLI Workflow:**
  - Generate migrations after editing `schema.ts`: `npm run db:generate`
  - Push schema to configured DB: `npm run db:push`
  - Create integrity-verified hot backup: `npm run db:backup`

