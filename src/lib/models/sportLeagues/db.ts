import { sportsLeaguesTable } from "../../../db/schema";

export type DBSportLeague = typeof sportsLeaguesTable.$inferSelect;

export type DBSportLeagueInsert = typeof sportsLeaguesTable.$inferInsert;

export type DBSportLeagueUpdate = Partial<DBSportLeagueInsert>;
