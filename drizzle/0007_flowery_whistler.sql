CREATE TABLE "external_sportsbooks" (
	"data_source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"sportsbook_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_sportsbooks_external_id_data_source_id_pk" PRIMARY KEY("external_id","data_source_id")
);
--> statement-breakpoint
CREATE TABLE "sportsbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_sportsbooks" ADD CONSTRAINT "external_sportsbooks_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sportsbooks" ADD CONSTRAINT "external_sportsbooks_sportsbook_id_sportsbooks_id_fk" FOREIGN KEY ("sportsbook_id") REFERENCES "public"."sportsbooks"("id") ON DELETE cascade ON UPDATE no action;