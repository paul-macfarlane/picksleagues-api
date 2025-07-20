import { and, eq, inArray } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { leagueMembersTable } from "../../db/schema";
import { DBLeagueMember, DBLeagueMemberInsert } from "./leagueMembers.types";

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
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueMember[]> {
    return await dbOrTx
      .select()
      .from(leagueMembersTable)
      .where(eq(leagueMembersTable.leagueId, leagueId));
  }

  async listByLeagueIds(
    leagueIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueMember[]> {
    if (leagueIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(leagueMembersTable)
      .where(inArray(leagueMembersTable.leagueId, leagueIds));
  }

  async deleteByUserId(userId: string, dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx
      .delete(leagueMembersTable)
      .where(eq(leagueMembersTable.userId, userId));
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
