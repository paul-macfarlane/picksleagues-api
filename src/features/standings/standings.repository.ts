import { eq, and, desc } from "drizzle-orm";
import { db, DBOrTx } from "../../db/index.js";
import { standingsTable } from "../../db/schema.js";
import {
  DBStandings,
  DBStandingsInsert,
  DBStandingsUpdate,
} from "./standings.types.js";

export class StandingsRepository {
  async findByUserLeagueSeason(
    userId: string,
    leagueId: string,
    seasonId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBStandings | null> {
    const result = await dbOrTx
      .select()
      .from(standingsTable)
      .where(
        and(
          eq(standingsTable.userId, userId),
          eq(standingsTable.leagueId, leagueId),
          eq(standingsTable.seasonId, seasonId),
        ),
      )
      .limit(1);

    return result[0] || null;
  }

  async create(
    data: DBStandingsInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBStandings> {
    const result = await dbOrTx.insert(standingsTable).values(data).returning();

    return result[0];
  }

  async update(
    userId: string,
    leagueId: string,
    seasonId: string,
    data: DBStandingsUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBStandings | null> {
    const result = await dbOrTx
      .update(standingsTable)
      .set(data)
      .where(
        and(
          eq(standingsTable.userId, userId),
          eq(standingsTable.leagueId, leagueId),
          eq(standingsTable.seasonId, seasonId),
        ),
      )
      .returning();

    return result[0] || null;
  }

  async deleteByUserLeagueSeason(
    userId: string,
    leagueId: string,
    seasonId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<void> {
    await dbOrTx
      .delete(standingsTable)
      .where(
        and(
          eq(standingsTable.userId, userId),
          eq(standingsTable.leagueId, leagueId),
          eq(standingsTable.seasonId, seasonId),
        ),
      );
  }

  async findByLeagueSeason(
    leagueId: string,
    seasonId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBStandings[]> {
    return dbOrTx
      .select()
      .from(standingsTable)
      .where(
        and(
          eq(standingsTable.leagueId, leagueId),
          eq(standingsTable.seasonId, seasonId),
        ),
      )
      .orderBy(desc(standingsTable.points));
  }
}
