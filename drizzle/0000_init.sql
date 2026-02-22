CREATE TABLE `install_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`key` text NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	`max_downloads` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `install_keys_key_unique` ON `install_keys` (`key`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_session_id` text NOT NULL,
	`stripe_customer_email` text,
	`product_id` text NOT NULL,
	`amount_total` integer,
	`currency` text DEFAULT 'usd',
	`payment_status` text NOT NULL,
	`metadata_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_stripe_session_id_unique` ON `purchases` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`account_key` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_account_key_unique` ON `users` (`account_key`);