CREATE TABLE `analytics_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`metric_date` text NOT NULL,
	`event_name` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bouquet_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_token_hash` text NOT NULL,
	`title` text NOT NULL,
	`occasion_tag` text,
	`stem_count` integer DEFAULT 0 NOT NULL,
	`scene_json` text NOT NULL,
	`published_slug` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_projects_workspace` ON `bouquet_projects` (`workspace_token_hash`,`updated_at`);--> statement-breakpoint
CREATE TABLE `bouquets` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`occasion_tag` text,
	`scene_json` text NOT NULL,
	`edit_token_hash` text NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text NOT NULL,
	`bouquet_ref` text,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`duration_sec` integer,
	`data_base64` text NOT NULL,
	`created_at` text NOT NULL
);
