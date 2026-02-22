-- Add currency + country_code columns to product_prices
ALTER TABLE `product_prices` ADD COLUMN `currency` text NOT NULL DEFAULT 'usd';
--> statement-breakpoint
ALTER TABLE `product_prices` ADD COLUMN `country_code` text NOT NULL DEFAULT '';
--> statement-breakpoint

-- Backfill currency by continent default
UPDATE `product_prices` SET `currency` = 'eur' WHERE `continent` = 'EU';
--> statement-breakpoint
UPDATE `product_prices` SET `currency` = 'aud' WHERE `continent` = 'OC';
--> statement-breakpoint

-- Replace unique index (drop old, create new with country_code)
DROP INDEX IF EXISTS `product_prices_product_continent_idx`;
--> statement-breakpoint
CREATE UNIQUE INDEX `product_prices_product_continent_country_idx`
  ON `product_prices` (`product_id`, `continent`, `country_code`);
--> statement-breakpoint

-- Seed JP overrides for Asia (country_code='JP', currency='jpy')
-- Formula: ceil((usd_price * 150) / 100) * 100 - 1
-- Skills (id 1-6): AS price $5 -> ceil(750/100)*100-1 = 799
-- bundle-once (id 7): AS price $15 -> ceil(2250/100)*100-1 = 2299
-- bundle-lifetime (id 8): AS price $49 -> ceil(7350/100)*100-1 = 7399
-- bundle-teams (id 9): AS price $149 -> ceil(22350/100)*100-1 = 22399
INSERT INTO `product_prices` (`product_id`, `continent`, `country_code`, `price`, `currency`) VALUES
(1, 'AS', 'JP', 799, 'jpy'),
(2, 'AS', 'JP', 799, 'jpy'),
(3, 'AS', 'JP', 799, 'jpy'),
(4, 'AS', 'JP', 799, 'jpy'),
(5, 'AS', 'JP', 799, 'jpy'),
(6, 'AS', 'JP', 799, 'jpy'),
(7, 'AS', 'JP', 2299, 'jpy'),
(8, 'AS', 'JP', 7399, 'jpy'),
(9, 'AS', 'JP', 22399, 'jpy');
