import { externalSportLeaguesTable } from "../../../db/schema";

export type DBExternalSportLeague =
  typeof externalSportLeaguesTable.$inferSelect;

export type DBExternalSportLeagueInsert =
  typeof externalSportLeaguesTable.$inferInsert;

export type DBExternalSportLeagueUpdate = Partial<DBExternalSportLeagueInsert>;
