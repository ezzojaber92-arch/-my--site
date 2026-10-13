CREATE TABLE `admin_email_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`created_by_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_email_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_email_access_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `reserve_settings` (
	`id` int NOT NULL,
	`reserve_name` varchar(255) NOT NULL,
	`location_name` varchar(255) NOT NULL,
	`map_url` varchar(1024) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`veterinary_service` text NOT NULL,
	`climate_service` text NOT NULL,
	`visit_hours` varchar(255) NOT NULL,
	`visit_description` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reserve_settings_id` PRIMARY KEY(`id`)
);
