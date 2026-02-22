-- Create products table
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`lifetime` integer DEFAULT 0 NOT NULL,
	`skill_slug` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_code_unique` ON `products` (`code`);
--> statement-breakpoint

-- Create product_prices table
CREATE TABLE `product_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`continent` text NOT NULL,
	`price` real NOT NULL,
	`stripe_price_id` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_prices_product_continent_idx` ON `product_prices` (`product_id`, `continent`);
--> statement-breakpoint

-- Migrate purchases: recreate with int product_id FK + audit cols
-- SQLite lacks ALTER COLUMN so we recreate the table
CREATE TABLE `purchases_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_session_id` text NOT NULL,
	`stripe_customer_email` text,
	`product_id` integer NOT NULL,
	`amount_total` integer,
	`currency` text DEFAULT 'usd',
	`payment_status` text NOT NULL,
	`pricing_continent` text,
	`price_snapshot` real,
	`metadata_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Copy existing rows (cast text product_id to 0 placeholder; no real purchases yet)
INSERT INTO `purchases_new` (`id`, `user_id`, `stripe_session_id`, `stripe_customer_email`, `product_id`, `amount_total`, `currency`, `payment_status`, `pricing_continent`, `price_snapshot`, `metadata_json`, `created_at`)
SELECT `id`, `user_id`, `stripe_session_id`, `stripe_customer_email`, 0, `amount_total`, `currency`, `payment_status`, NULL, NULL, `metadata_json`, `created_at`
FROM `purchases`;
--> statement-breakpoint
DROP TABLE `purchases`;
--> statement-breakpoint
ALTER TABLE `purchases_new` RENAME TO `purchases`;
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_stripe_session_id_unique` ON `purchases` (`stripe_session_id`);
--> statement-breakpoint

-- Seed products
INSERT INTO `products` (`code`, `name`, `version`, `lifetime`, `skill_slug`, `created_at`) VALUES
('skill-frontend', 'Elite Skill — Frontend', '1.0.0', 0, 'frontend', datetime('now')),
('skill-backend', 'Elite Skill — Backend', '1.0.0', 0, 'backend', datetime('now')),
('skill-style', 'Elite Skill — Style', '1.0.0', 0, 'style', datetime('now')),
('skill-code-review', 'Elite Skill — Code Review', '1.0.0', 0, 'code-review', datetime('now')),
('skill-feature-enhancer', 'Elite Skill — Feature Enhancer', '1.0.0', 0, 'feature-enhancer', datetime('now')),
('skill-app-bootstrap', 'Elite Skill — App Bootstrap', '1.0.0', 0, 'app-bootstrap', datetime('now')),
('bundle-once', 'Elite AI Skills — All Skills', '1.0.0', 0, NULL, datetime('now')),
('bundle-lifetime', 'Elite AI Skills — Lifetime Access', '1.0.0', 1, NULL, datetime('now')),
('bundle-teams', 'Elite AI Skills — Teams', '1.0.0', 1, NULL, datetime('now'));
--> statement-breakpoint

-- Seed product_prices (USD per continent)
-- Skills: $9 base (NA), geo-adjusted per continent
INSERT INTO `product_prices` (`product_id`, `continent`, `price`) VALUES
-- skill-frontend (id=1)
(1, 'NA', 9), (1, 'EU', 9), (1, 'OC', 9),
(1, 'SA', 5), (1, 'AF', 3), (1, 'AS', 5), (1, 'AN', 9),
-- skill-backend (id=2)
(2, 'NA', 9), (2, 'EU', 9), (2, 'OC', 9),
(2, 'SA', 5), (2, 'AF', 3), (2, 'AS', 5), (2, 'AN', 9),
-- skill-style (id=3)
(3, 'NA', 9), (3, 'EU', 9), (3, 'OC', 9),
(3, 'SA', 5), (3, 'AF', 3), (3, 'AS', 5), (3, 'AN', 9),
-- skill-code-review (id=4)
(4, 'NA', 9), (4, 'EU', 9), (4, 'OC', 9),
(4, 'SA', 5), (4, 'AF', 3), (4, 'AS', 5), (4, 'AN', 9),
-- skill-feature-enhancer (id=5)
(5, 'NA', 9), (5, 'EU', 9), (5, 'OC', 9),
(5, 'SA', 5), (5, 'AF', 3), (5, 'AS', 5), (5, 'AN', 9),
-- skill-app-bootstrap (id=6)
(6, 'NA', 9), (6, 'EU', 9), (6, 'OC', 9),
(6, 'SA', 5), (6, 'AF', 3), (6, 'AS', 5), (6, 'AN', 9),
-- bundle-once (id=7)
(7, 'NA', 29), (7, 'EU', 29), (7, 'OC', 29),
(7, 'SA', 15), (7, 'AF', 9), (7, 'AS', 15), (7, 'AN', 29),
-- bundle-lifetime (id=8)
(8, 'NA', 99), (8, 'EU', 99), (8, 'OC', 99),
(8, 'SA', 49), (8, 'AF', 29), (8, 'AS', 49), (8, 'AN', 99),
-- bundle-teams (id=9)
(9, 'NA', 299), (9, 'EU', 299), (9, 'OC', 299),
(9, 'SA', 149), (9, 'AF', 89), (9, 'AS', 149), (9, 'AN', 299);
