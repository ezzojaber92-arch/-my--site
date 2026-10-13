CREATE TABLE `camel_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`record_code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`image_url` varchar(1024) NOT NULL,
	`shade` varchar(255) NOT NULL,
	`owner` varchar(255) NOT NULL,
	`father` varchar(255) NOT NULL,
	`mother` varchar(255) NOT NULL,
	`maternal_sibling` text,
	`maternal_sibling_label` varchar(100) NOT NULL,
	`status` text NOT NULL,
	`achievements` text NOT NULL,
	`production` text NOT NULL,
	`worker` varchar(255) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`note` text NOT NULL,
	`is_published` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `camel_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `camel_records_record_code_unique` UNIQUE(`record_code`)
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_kind` enum('news','announcement','photo','video') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`media_url` varchar(1024),
	`media_key` varchar(1024),
	`camel_record_id` int,
	`is_published` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`published_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
