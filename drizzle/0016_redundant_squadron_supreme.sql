ALTER TABLE "seasons" ALTER COLUMN "start_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "end_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "standings" ADD COLUMN "rank" integer DEFAULT 1 NOT NULL;