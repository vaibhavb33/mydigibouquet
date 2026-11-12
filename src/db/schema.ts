import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const bouquets = sqliteTable("bouquets", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  occasionTag: text("occasion_tag"),
  sceneJson: text("scene_json").notNull(),
  editTokenHash: text("edit_token_hash").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const bouquetProjects = sqliteTable(
  "bouquet_projects",
  {
    id: text("id").primaryKey(),
    workspaceTokenHash: text("workspace_token_hash").notNull(),
    title: text("title").notNull(),
    occasionTag: text("occasion_tag"),
    stemCount: integer("stem_count").notNull().default(0),
    sceneJson: text("scene_json").notNull(),
    publishedSlug: text("published_slug"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [index("idx_projects_workspace").on(table.workspaceTokenHash, table.updatedAt)],
);

export const mediaAttachments = sqliteTable("media_attachments", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  durationSec: integer("duration_sec"),
  dataBase64: text("data_base64").notNull(),
  createdAt: text("created_at").notNull(),
});

export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  bouquetRef: text("bouquet_ref"),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const analyticsDaily = sqliteTable("analytics_daily", {
  id: text("id").primaryKey(),
  metricDate: text("metric_date").notNull(),
  eventName: text("event_name").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export type BouquetRow = typeof bouquets.$inferSelect;
export type BouquetProjectRow = typeof bouquetProjects.$inferSelect;
export type MediaAttachmentRow = typeof mediaAttachments.$inferSelect;
export type ContactMessageRow = typeof contactMessages.$inferSelect;
export type AnalyticsDailyRow = typeof analyticsDaily.$inferSelect;

