CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_name_unique` ON `permissions` (`name`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
