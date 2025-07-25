ALTER TABLE "odds" ALTER COLUMN "spread_home" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "spread_home" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "spread_away" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "spread_away" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "moneyline_home" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "moneyline_away" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "total" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "odds" ALTER COLUMN "total" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "odds" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sportsbooks" ADD COLUMN "is_default" boolean DEFAULT false;