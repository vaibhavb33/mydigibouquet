import crypto from "node:crypto";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import * as schema from "./schema";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { getDatabaseConfig } from "@/lib/env";

type PetalDbInstance = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __petalLibsqlClient: Client | undefined;
  var __petalDrizzleDb: PetalDbInstance | undefined;
  var __petalDbInitPromise: Promise<void> | undefined;
}

function getClient(): Client {
  if (!globalThis.__petalLibsqlClient) {
    const cfg = getDatabaseConfig();
    globalThis.__petalLibsqlClient = createClient({
      url: cfg.url,
      ...(cfg.authToken ? { authToken: cfg.authToken } : {}),
    });
  }
  return globalThis.__petalLibsqlClient;
}

function getDbInstance(): PetalDbInstance {
  if (!globalThis.__petalDrizzleDb) {
    globalThis.__petalDrizzleDb = drizzle(getClient(), { schema });
  }
  return globalThis.__petalDrizzleDb;
}

/**
 * Lazy proxy avoids opening SQLite files during module evaluation on serverless imports.
 */
export const db: PetalDbInstance = new Proxy({} as PetalDbInstance, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export function hashEditToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function ensureDbReady(): Promise<void> {
  if (!globalThis.__petalDbInitPromise) {
    globalThis.__petalDbInitPromise = (async () => {
      const client = getClient();
      const cfg = getDatabaseConfig();
      if (cfg.mode === "local-sqlite") {
        await client.execute("PRAGMA foreign_keys = ON;");
        await client.execute("PRAGMA journal_mode = WAL;");
      }

      await client.execute(`
        CREATE TABLE IF NOT EXISTS bouquets (
          slug TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          occasion_tag TEXT,
          scene_json TEXT NOT NULL,
          edit_token_hash TEXT NOT NULL,
          view_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        )
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS bouquet_projects (
          id TEXT PRIMARY KEY NOT NULL,
          workspace_token_hash TEXT NOT NULL,
          title TEXT NOT NULL,
          occasion_tag TEXT,
          stem_count INTEGER NOT NULL DEFAULT 0,
          scene_json TEXT NOT NULL,
          published_slug TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        )
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_projects_workspace
        ON bouquet_projects(workspace_token_hash, updated_at DESC)
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS media_attachments (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          duration_sec INTEGER,
          data_base64 TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          topic TEXT NOT NULL,
          bouquet_ref TEXT,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS analytics_daily (
          id TEXT PRIMARY KEY NOT NULL,
          metric_date TEXT NOT NULL,
          event_name TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL
        )
      `);

      // Idempotently seed showcase curated sample bouquets if missing
      const now = new Date().toISOString();
      for (const preset of STARTER_BOUQUETS.slice(0, 4)) {
        const showcaseSlug = `sample-${preset.id}`;
        const existing = await db
          .select({ slug: schema.bouquets.slug })
          .from(schema.bouquets)
          .where(eq(schema.bouquets.slug, showcaseSlug))
          .limit(1);

        if (existing.length === 0) {
          const baseScene = buildSceneFromPreset(preset, CATALOG_META_MAP);
          const scene = { ...baseScene, isPublicShowcase: true, hideNamesInPreview: false };
          await db.insert(schema.bouquets).values({
            slug: showcaseSlug,
            title: preset.title,
            occasionTag: preset.occasion,
            sceneJson: JSON.stringify(scene),
            editTokenHash: hashEditToken(`seed-${preset.id}`),
            viewCount: 12,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          });
        }
      }
    })().catch((err) => {
      globalThis.__petalDbInitPromise = undefined;
      throw err;
    });
  }
  return globalThis.__petalDbInitPromise;
}

export async function getRecentGalleryBouquets(limit = 12) {
  await ensureDbReady();
  return db
    .select({
      slug: schema.bouquets.slug,
      title: schema.bouquets.title,
      occasionTag: schema.bouquets.occasionTag,
      sceneJson: schema.bouquets.sceneJson,
      viewCount: schema.bouquets.viewCount,
      createdAt: schema.bouquets.createdAt,
    })
    .from(schema.bouquets)
    .where(
      and(
        isNull(schema.bouquets.deletedAt),
        or(
          like(schema.bouquets.slug, "sample-%"),
          like(schema.bouquets.slug, "pub-%"),
          like(schema.bouquets.sceneJson, '%"isPublicShowcase":true%'),
        ),
      ),
    )
    .orderBy(desc(schema.bouquets.createdAt))
    .limit(limit);
}

