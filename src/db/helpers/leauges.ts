import { DBOrTx } from "..";
import {
  DBLeagueMemberInsert,
  DBLeagueMember,
  leagueMembersTable,
  leaguesTable,
} from "../schema";
import { DBLeague } from "../schema";
import { DBLeagueInsert } from "../schema";

export async function insertLeague(
  dbOrTx: DBOrTx,
  league: DBLeagueInsert,
): Promise<DBLeague> {
  const leagues = await dbOrTx.insert(leaguesTable).values(league).returning();
  return leagues[0];
}

export async function insertLeagueMember(
  dbOrTx: DBOrTx,
  leagueMember: DBLeagueMemberInsert,
): Promise<DBLeagueMember> {
  const leagueMembers = await dbOrTx
    .insert(leagueMembersTable)
    .values(leagueMember)
    .returning();
  return leagueMembers[0];
}
