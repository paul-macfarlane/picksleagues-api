import { leagueTypesTable } from "../../../db/schema";

export type DBLeagueType = typeof leagueTypesTable.$inferSelect;

export type DBLeagueTypeInsert = typeof leagueTypesTable.$inferInsert;

export type DBLeagueTypeUpdate = Partial<DBLeagueTypeInsert>;
