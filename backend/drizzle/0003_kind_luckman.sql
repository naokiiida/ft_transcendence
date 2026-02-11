PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`uuid` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`intra_id` text,
	`intra_username` text,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`user_score` integer DEFAULT 1000 NOT NULL,
	`created_at` text NOT NULL,
	`last_seen` text NOT NULL,
	`method` text DEFAULT 'email' NOT NULL,
	CONSTRAINT "chk_email_auth" CHECK("__new_users"."method" != 'email' OR "__new_users"."password_hash" IS NOT NULL),
	CONSTRAINT "chk_intra_auth" CHECK("__new_users"."method" != 'intra' OR ("__new_users"."intra_id" IS NOT NULL AND "__new_users"."intra_username" IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_users`("uuid", "email", "password_hash", "display_name", "avatar_url", "intra_id", "intra_username", "wins", "losses", "user_score", "created_at", "last_seen", "method") SELECT "uuid", "email", "password_hash", "display_name", "avatar_url", "intra_id", "intra_username", "wins", "losses", "user_score", "created_at", "last_seen", "method" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_display_name_unique` ON `users` (`display_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_intra_id_unique` ON `users` (`intra_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_intra_username_unique` ON `users` (`intra_username`);--> statement-breakpoint
CREATE INDEX `idx_user_score` ON `users` (`user_score`);