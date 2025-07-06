CREATE TABLE "external_phases" (
	"data_source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"phase_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_phases_external_id_data_source_id_pk" PRIMARY KEY("external_id","data_source_id")
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"phase_template_id" uuid NOT NULL,
	"type" text NOT NULL,
	"sequence" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_phases" ADD CONSTRAINT "external_phases_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_phases" ADD CONSTRAINT "external_phases_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_phase_template_id_phase_templates_id_fk" FOREIGN KEY ("phase_template_id") REFERENCES "public"."phase_templates"("id") ON DELETE cascade ON UPDATE no action;