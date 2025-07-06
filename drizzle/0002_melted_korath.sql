CREATE TABLE "external_seasons" (
	"data_source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"season_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_seasons_external_id_data_source_id_pk" PRIMARY KEY("external_id","data_source_id")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport_league_id" uuid NOT NULL,
	"name" text NOT NULL,
	"year" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp
);
--> statement-breakpoint
ALTER TABLE "external_sport_leagues" ALTER COLUMN "sport_league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "external_seasons" ADD CONSTRAINT "external_seasons_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_seasons" ADD CONSTRAINT "external_seasons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_sport_league_id_sports_leagues_id_fk" FOREIGN KEY ("sport_league_id") REFERENCES "public"."sports_leagues"("id") ON DELETE cascade ON UPDATE no action;