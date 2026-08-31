CREATE TABLE `student_states` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutor_daily_usage` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`last_request_at` integer DEFAULT 0 NOT NULL,
	`active_until` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `tutor_global_usage` (
	`period` text PRIMARY KEY NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL
);
