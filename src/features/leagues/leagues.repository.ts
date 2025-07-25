import { and, eq, inArray } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import {
  leagueMembersTable,
  leaguesTable,
  leagueTypesTable,
} from "../../db/schema.js";
import { DBLeague, DBLeagueInsert, DBLeagueUpdate } from "./leagues.types.js";
import { LEAGUE_TYPE_SLUGS } from "../leagueTypes/leagueTypes.types.js";

@injectable()
export class LeaguesRepository {
  async create(league: DBLeagueInsert, dbOrTx: DBOrTx = db): Promise<DBLeague> {
    const [newLeague] = await dbOrTx
      .insert(leaguesTable)
      .values(league)
      .returning();
    return newLeague;
  }

  async update(
    id: string,
    league: DBLeagueUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeague> {
    const [updatedLeague] = await dbOrTx
      .update(leaguesTable)
      .set(league)
      .where(eq(leaguesTable.id, id))
      .returning();
    return updatedLeague;
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

  async listByIds(
    leagueIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeague[]> {
    if (leagueIds.length === 0) {
      return [];
    }
    const leagues = await dbOrTx
      .select()
      .from(leaguesTable)
      .where(inArray(leaguesTable.id, leagueIds));
    return leagues;
  }

  async listByUserIdAndLeagueTypeId(
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

  async listByUserIdAndLeagueTypeSlug(
    userId: string,
    leagueTypeSlug: LEAGUE_TYPE_SLUGS,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeague[]> {
    const result = await dbOrTx
      .select({
        league: leaguesTable,
      })
      .from(leaguesTable)
      .innerJoin(
        leagueTypesTable,
        eq(leaguesTable.leagueTypeId, leagueTypesTable.id),
      )
      .innerJoin(
        leagueMembersTable,
        eq(leaguesTable.id, leagueMembersTable.leagueId),
      )
      .where(
        and(
          eq(leagueTypesTable.slug, leagueTypeSlug),
          eq(leagueMembersTable.userId, userId),
        ),
      );
    return result.map((row) => row.league);
  }

  async listByUserId(userId: string, dbOrTx: DBOrTx = db): Promise<DBLeague[]> {
    const result = await dbOrTx
      .select({ league: leaguesTable })
      .from(leaguesTable)
      .innerJoin(
        leagueMembersTable,
        eq(leaguesTable.id, leagueMembersTable.leagueId),
      )
      .where(eq(leagueMembersTable.userId, userId));

    return result.map((row) => row.league);
  }

  async delete(id: string, dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx.delete(leaguesTable).where(eq(leaguesTable.id, id));
  }
}
