CREATE TABLE `users` (
	`uuid` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`intra_id` text,
	`intra_username` text,
	`oauth_access_token` text,
	`oauth_refresh_token` text,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`user_score` integer DEFAULT 1000 NOT NULL,
	`created_at` text NOT NULL,
	`last_seen` text NOT NULL,
	`method` text DEFAULT 'email' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_display_name_unique` ON `users` (`display_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_intra_id_unique` ON `users` (`intra_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_intra_username_unique` ON `users` (`intra_username`);--> statement-breakpoint
CREATE INDEX `idx_user_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_intra_id` ON `users` (`intra_id`);--> statement-breakpoint
CREATE INDEX `idx_user_score` ON `users` (`user_score`);