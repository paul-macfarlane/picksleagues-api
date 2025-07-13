import { externalSportLeaguesTable, sportsLeaguesTable } from "../../db/schema";

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
