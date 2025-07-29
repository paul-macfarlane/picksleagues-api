CREATE TABLE "standings" (
	"user_id" text NOT NULL,
	"league_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "standings_user_id_league_id_season_id_pk" PRIMARY KEY("user_id","league_id","season_id")
);
--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "season_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "picks" ADD COLUMN "result" text;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picks" ADD CONSTRAINT "picks_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;