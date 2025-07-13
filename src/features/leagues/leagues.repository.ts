import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { leagueMembersTable, leaguesTable } from "../../db/schema";
import { DBLeague, DBLeagueInsert } from "./leagues.types";

@injectable()
export class LeaguesRepository {
  async create(league: DBLeagueInsert, dbOrTx: DBOrTx = db): Promise<DBLeague> {
    const [newLeague] = await dbOrTx
      .insert(leaguesTable)
      .values(league)
      .returning();
    return newLeague;
  }

  async findByUserIdAndLeagueTypeId(
    userId: string,
    leagueTypeId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeague[]> {
    const result = await dbOrTx
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

    return result.map((row) => row.league);
  }

  async findById(
    leagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeague | null> {
    const [league] = await dbOrTx
      .select()
      .from(leaguesTable)
      .where(eq(leaguesTable.id, leagueId));
    return league ?? null;
  }
}
