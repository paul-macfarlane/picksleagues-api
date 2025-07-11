import { leaguesTable } from "../../../db/schema";

export type DBLeague = typeof leaguesTable.$inferSelect;

export type DBLeagueInsert = typeof leaguesTable.$inferInsert;

export type DBLeagueUpdate = Partial<DBLeagueInsert>;
