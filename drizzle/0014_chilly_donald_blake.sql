CREATE TABLE `content_guest_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_item_id` int NOT NULL,
	`visitor_token` varchar(64) NOT NULL,
	`author_name` varchar(100) NOT NULL DEFAULT 'زائر المحمية',
	`body` text NOT NULL,
	`is_visible` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_guest_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_guest_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_item_id` int NOT NULL,
	`visitor_token` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_guest_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_guest_likes_content_visitor_unique` UNIQUE(`content_item_id`,`visitor_token`)
);
