CREATE TABLE `camel_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`camel_record_id` int NOT NULL,
	`image_url` varchar(1024) NOT NULL,
	`media_key` varchar(1024),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `camel_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_item_id` int NOT NULL,
	`user_id` int NOT NULL,
	`body` text NOT NULL,
	`is_visible` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_item_id` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_likes_content_user_unique` UNIQUE(`content_item_id`,`user_id`)
);
