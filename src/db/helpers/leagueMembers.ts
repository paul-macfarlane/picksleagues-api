import { and, eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { leagueMembersTable, profilesTable } from "../schema";
import {
  DBLeagueMember,
  DBLeagueMemberWithProfile,
} from "../../lib/models/leagueMembers/db";
import { DBLeagueMemberInsert } from "../../lib/models/leagueMembers/db";

export async function insertLeagueMember(
  dbOrTx: DBOrTx,
  data: DBLeagueMemberInsert,
): Promise<DBLeagueMember> {
  const [leagueMember] = await dbOrTx
    .insert(leagueMembersTable)
    .values(data)
    .returning();
  return leagueMember;
}

export async function getLeagueMemberByLeagueAndUserId(
  dbOrTx: DBOrTx,
  leagueId: string,
  userId: string,
): Promise<DBLeagueMember | undefined> {
  const leagueMember = await dbOrTx
    .select()
    .from(leagueMembersTable)
    .where(
      and(
        eq(leagueMembersTable.leagueId, leagueId),
        eq(leagueMembersTable.userId, userId),
      ),
    );
  return leagueMember[0];
}

export async function getLeagueMembersWithProfileByLeagueId(
  dbOrTx: DBOrTx,
  leagueId: string,
): Promise<DBLeagueMemberWithProfile[]> {
  const members = await dbOrTx
    .select({
      leagueMember: leagueMembersTable,
      profile: profilesTable,
    })
    .from(leagueMembersTable)
    .where(eq(leagueMembersTable.leagueId, leagueId))
    .innerJoin(
      profilesTable,
      eq(leagueMembersTable.userId, profilesTable.userId),
    );
  return members.map((member) => ({
    ...member.leagueMember,
    profile: member.profile,
  }));
}
