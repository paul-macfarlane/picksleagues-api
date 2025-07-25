ALTER TABLE "live_scores" ALTER COLUMN "clock" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "live_scores" DROP COLUMN "period";