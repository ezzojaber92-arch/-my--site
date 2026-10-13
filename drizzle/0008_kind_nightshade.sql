CREATE TABLE `camel_production_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`camel_record_id` int NOT NULL,
	`url` varchar(1024) NOT NULL,
	`platform` varchar(100) NOT NULL,
	`linked_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `camel_production_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `camel_production_links_camel_url_unique` UNIQUE(`camel_record_id`,`url`)
);
