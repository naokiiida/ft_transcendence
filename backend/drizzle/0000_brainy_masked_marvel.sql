CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_id` text NOT NULL,
	`addressee_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`addressee_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_no_self_friend" CHECK("friendships"."requester_id" != "friendships"."addressee_id")
);
--> statement-breakpoint
CREATE INDEX `idx_friendship_requester` ON `friendships` (`requester_id`);--> statement-breakpoint
CREATE INDEX `idx_friendship_addressee` ON `friendships` (`addressee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_friendship_pair` ON `friendships` (`requester_id`,`addressee_id`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`player1_id` text NOT NULL,
	`player2_id` text,
	`winner_id` text,
	`player1_score` integer DEFAULT 0 NOT NULL,
	`player2_score` integer DEFAULT 0 NOT NULL,
	`game_type` text NOT NULL,
	`ai_difficulty` text,
	`status` text NOT NULL,
	`score_delta` integer,
	`started_at` text,
	`ended_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`player1_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player2_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_game_player1` ON `games` (`player1_id`);--> statement-breakpoint
CREATE INDEX `idx_game_player2` ON `games` (`player2_id`);--> statement-breakpoint
CREATE INDEX `idx_game_status` ON `games` (`status`);--> statement-breakpoint
CREATE INDEX `idx_game_created` ON `games` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_session_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_session_expires` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
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
	CONSTRAINT "chk_email_auth" CHECK("users"."method" != 'email' OR "users"."password_hash" IS NOT NULL),
	CONSTRAINT "chk_intra_auth" CHECK("users"."method" != 'intra' OR ("users"."intra_id" IS NOT NULL AND "users"."intra_username" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_display_name_unique` ON `users` (`display_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_intra_id_unique` ON `users` (`intra_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_intra_username_unique` ON `users` (`intra_username`);--> statement-breakpoint
CREATE INDEX `idx_user_score` ON `users` (`user_score`);