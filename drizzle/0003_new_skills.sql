-- Add Testing and Deploy skill products
INSERT INTO `products` (`id`, `code`, `name`, `version`, `lifetime`, `skill_slug`, `created_at`) VALUES
(10, 'skill-testing', 'Elite Skill — Testing', '1.0.0', 0, 'testing', datetime('now')),
(11, 'skill-deploy', 'Elite Skill — Deploy', '1.0.0', 0, 'deploy', datetime('now'));
--> statement-breakpoint

-- Seed product_prices for new skills (same geo-pricing as existing skills)
INSERT INTO `product_prices` (`product_id`, `continent`, `price`) VALUES
-- skill-testing (id=10)
(10, 'NA', 9), (10, 'EU', 9), (10, 'OC', 9),
(10, 'SA', 5), (10, 'AF', 3), (10, 'AS', 5), (10, 'AN', 9),
-- skill-deploy (id=11)
(11, 'NA', 9), (11, 'EU', 9), (11, 'OC', 9),
(11, 'SA', 5), (11, 'AF', 3), (11, 'AS', 5), (11, 'AN', 9);
