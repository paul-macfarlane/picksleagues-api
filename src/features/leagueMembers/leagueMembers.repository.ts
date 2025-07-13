import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { leagueMembersTable, profilesTable } from "../../db/schema";
import {
  DBLeagueMember,
  DBLeagueMemberInsert,
  DBLeagueMemberWithProfile,
} from "./leagueMembers.types";

@injectable()
export class LeagueMembersRepository {
  async create(
    data: DBLeagueMemberInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueMember> {
    const [newMember] = await dbOrTx
      .insert(leagueMembersTable)
      .values(data)
      .returning();
    return newMember;
  }

  async listByLeagueId(
    leagueId: string,
    options?: { include?: "profile"[] },
    dbOrTx: DBOrTx = db,
  ): Promise<(DBLeagueMember | DBLeagueMemberWithProfile)[]> {
    if (options?.include?.includes("profile")) {
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

    return await dbOrTx
      .select()
      .from(leagueMembersTable)
      .where(eq(leagueMembersTable.leagueId, leagueId));
  }

  async findByLeagueAndUserId(
    leagueId: string,
    userId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueMember | null> {
    const leagueMember = await dbOrTx
      .select()
      .from(leagueMembersTable)
      .where(
        and(
          eq(leagueMembersTable.leagueId, leagueId),
          eq(leagueMembersTable.userId, userId),
        ),
      );
    return leagueMember[0] ?? null;
  }
}
