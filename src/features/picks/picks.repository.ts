import { injectable } from "inversify";
import { DBOrTx, db } from "../../db/index.js";
import {
  DBPick,
  DBPickInsert,
  DBPickUpdate,
  UnassessedPick,
} from "./picks.types.js";
import {
  eventsTable,
  outcomesTable,
  picksTable,
  leagueMembersTable,
} from "../../db/schema.js";
import { and, eq, inArray, isNull } from "drizzle-orm";

@injectable()
export class PicksRepository {
  async create(pick: DBPickInsert, dbOrTx: DBOrTx = db): Promise<DBPick> {
    const [newPick] = await dbOrTx.insert(picksTable).values(pick).returning();
    return newPick;
  }

  async update(
    id: string,
    pick: DBPickUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick> {
    const [updatedPick] = await dbOrTx
      .update(picksTable)
      .set(pick)
      .where(eq(picksTable.id, id))
      .returning();
    return updatedPick;
  }

  async findById(id: string, dbOrTx: DBOrTx = db): Promise<DBPick | null> {
    const [pick] = await dbOrTx
      .select()
      .from(picksTable)
      .where(eq(picksTable.id, id));
    return pick || null;
  }

  async findByUserIdAndLeagueId(
    userId: string,
    leagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick[]> {
    return dbOrTx
      .select()
      .from(picksTable)
      .where(
        and(eq(picksTable.userId, userId), eq(picksTable.leagueId, leagueId)),
      );
  }

  async findByUserIdAndEventIds(
    userId: string,
    eventIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick[]> {
    if (eventIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(picksTable)
      .where(
        and(
          eq(picksTable.userId, userId),
          inArray(picksTable.eventId, eventIds),
        ),
      );
  }

  async findByLeagueIdAndEventIds(
    leagueId: string,
    eventIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick[]> {
    if (eventIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(picksTable)
      .where(
        and(
          eq(picksTable.leagueId, leagueId),
          inArray(picksTable.eventId, eventIds),
        ),
      );
  }

  async findByLeagueIdAndEventIdsForMembers(
    leagueId: string,
    eventIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick[]> {
    if (eventIds.length === 0) {
      return [];
    }
    const result = await dbOrTx
      .select({
        pick: picksTable,
      })
      .from(picksTable)
      .innerJoin(
        leagueMembersTable,
        and(
          eq(picksTable.userId, leagueMembersTable.userId),
          eq(picksTable.leagueId, leagueMembersTable.leagueId),
        ),
      )
      .where(
        and(
          eq(picksTable.leagueId, leagueId),
          inArray(picksTable.eventId, eventIds),
        ),
      );

    return result.map((row) => row.pick);
  }

  async findByUserIdAndLeagueIdAndEventIds(
    userId: string,
    leagueId: string,
    eventIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick[]> {
    if (eventIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(picksTable)
      .where(
        and(
          eq(picksTable.userId, userId),
          eq(picksTable.leagueId, leagueId),
          inArray(picksTable.eventId, eventIds),
        ),
      );
  }

  async findUnassessedPicksForLeague(
    leagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<UnassessedPick[]> {
    const result = await dbOrTx
      .select({
        id: picksTable.id,
        userId: picksTable.userId,
        leagueId: picksTable.leagueId,
        seasonId: picksTable.seasonId,
        eventId: picksTable.eventId,
        teamId: picksTable.teamId,
        spread: picksTable.spread,
        homeScore: outcomesTable.homeScore,
        awayScore: outcomesTable.awayScore,
        homeTeamId: eventsTable.homeTeamId,
        awayTeamId: eventsTable.awayTeamId,
      })
      .from(picksTable)
      .innerJoin(eventsTable, eq(picksTable.eventId, eventsTable.id))
      .innerJoin(outcomesTable, eq(picksTable.eventId, outcomesTable.eventId))
      .innerJoin(
        leagueMembersTable,
        and(
          eq(picksTable.userId, leagueMembersTable.userId),
          eq(picksTable.leagueId, leagueMembersTable.leagueId),
        ),
      )
      .where(and(eq(picksTable.leagueId, leagueId), isNull(picksTable.result)));

    return result.map((row) => ({
      id: row.id,
      userId: row.userId,
      leagueId: row.leagueId,
      seasonId: row.seasonId,
      eventId: row.eventId,
      teamId: row.teamId,
      spread: row.spread ? Number(row.spread) : null,
      outcome: {
        homeScore: row.homeScore,
        awayScore: row.awayScore,
      },
      event: {
        homeTeamId: row.homeTeamId,
        awayTeamId: row.awayTeamId,
      },
    }));
  }
}
