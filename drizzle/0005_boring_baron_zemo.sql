ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "sports_leagues" ADD CONSTRAINT "sports_leagues_name_unique" UNIQUE("name");