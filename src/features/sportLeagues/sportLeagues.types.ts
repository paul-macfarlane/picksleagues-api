import {
  ESPN_LEAGUE_SLUGS,
  ESPN_SPORT_SLUGS,
} from "../../integrations/espn/espn.types.js";
import { externalSportLeaguesTable, sportsLeaguesTable } from "../../db/schema.js";
import { z } from "zod";

// Constants

export enum SPORT_LEAGUE_NAMES {
  NFL = "NFL",
}

// DB Types

export type DBSportLeague = typeof sportsLeaguesTable.$inferSelect;
export type DBSportLeagueInsert = typeof sportsLeaguesTable.$inferInsert;
export type DBSportLeagueUpdate = Partial<DBSportLeagueInsert>;

export type DBExternalSportLeague =
  typeof externalSportLeaguesTable.$inferSelect;
export type DBExternalSportLeagueInsert =
  typeof externalSportLeaguesTable.$inferInsert;
export type DBExternalSportLeagueUpdate = Partial<DBExternalSportLeagueInsert>;

// Validation Schemas

export const EspnExternalSportLeagueMetadataSchema = z.object({
  sportSlug: z.nativeEnum(ESPN_SPORT_SLUGS),
  leagueSlug: z.nativeEnum(ESPN_LEAGUE_SLUGS),
});
