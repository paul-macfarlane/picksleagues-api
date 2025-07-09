import { and, eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { leagueMembersTable } from "../schema";
import { DBLeagueMember } from "../schema";

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
