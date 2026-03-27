CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`originalAudioUrl` text,
	`melodyDescription` text,
	`inputMode` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `styleImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`styleId` varchar(32) NOT NULL,
	`imageUrl` text NOT NULL,
	`prompt` text,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `styleImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`styleId` varchar(32) NOT NULL,
	`variant` varchar(32) NOT NULL,
	`trackName` varchar(200),
	`audioUrl` text,
	`imageUrl` text,
	`caption` text,
	`duration` int,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`)
);
