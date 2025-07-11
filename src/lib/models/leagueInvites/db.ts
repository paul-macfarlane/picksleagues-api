import { leagueInvitesTable } from "../../../db/schema";
import { DBLeague } from "../leagues/db";
import { DBLeagueType } from "../leagueTypes/db";

export type DBLeagueInvite = typeof leagueInvitesTable.$inferSelect;

export type DBLeagueInviteInsert = typeof leagueInvitesTable.$inferInsert;

export type DBLeagueInviteUpdate = Partial<DBLeagueInviteInsert>;

export type LeagueInviteWithLeagueAndType = DBLeagueInvite & {
  league: DBLeague;
  leagueType: DBLeagueType;
};
