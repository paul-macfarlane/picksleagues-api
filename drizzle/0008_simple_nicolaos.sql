CREATE TABLE "external_odds" (
	"data_source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"odds_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_odds_external_id_data_source_id_pk" PRIMARY KEY("external_id","data_source_id")
);
--> statement-breakpoint
CREATE TABLE "odds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"sportsbook_id" uuid NOT NULL,
	"spread_home" numeric NOT NULL,
	"spread_away" numeric NOT NULL,
	"moneyline_home" integer NOT NULL,
	"moneyline_away" integer NOT NULL,
	"total" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_odds" ADD CONSTRAINT "external_odds_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_odds" ADD CONSTRAINT "external_odds_odds_id_odds_id_fk" FOREIGN KEY ("odds_id") REFERENCES "public"."odds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odds" ADD CONSTRAINT "odds_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odds" ADD CONSTRAINT "odds_sportsbook_id_sportsbooks_id_fk" FOREIGN KEY ("sportsbook_id") REFERENCES "public"."sportsbooks"("id") ON DELETE cascade ON UPDATE no action;