import { and, eq } from "drizzle-orm";
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

export async function getLeaguesByUserIdAndLeagueTypeId(
  dbOrTx: DBOrTx,
  userId: string,
  leagueTypeId: string,
): Promise<DBLeague[]> {
  const leagues = await dbOrTx
    .select({
      league: leaguesTable,
    })
    .from(leaguesTable)
    .innerJoin(
      leagueMembersTable,
      eq(leaguesTable.id, leagueMembersTable.leagueId),
    )
    .where(
      and(
        eq(leaguesTable.leagueTypeId, leagueTypeId),
        eq(leagueMembersTable.userId, userId),
      ),
    );

  return leagues.map((league) => league.league);
}

export async function getLeagueById(
  dbOrTx: DBOrTx,
  leagueId: string,
): Promise<DBLeague | undefined> {
  const leagues = await dbOrTx
    .select()
    .from(leaguesTable)
    .where(eq(leaguesTable.id, leagueId));
  return leagues[0];
}
