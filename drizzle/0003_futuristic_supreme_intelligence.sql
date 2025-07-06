CREATE TABLE "phase_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport_league_id" uuid NOT NULL,
	"label" text NOT NULL,
	"sequence" integer NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phase_templates" ADD CONSTRAINT "phase_templates_sport_league_id_sports_leagues_id_fk" FOREIGN KEY ("sport_league_id") REFERENCES "public"."sports_leagues"("id") ON DELETE cascade ON UPDATE no action;