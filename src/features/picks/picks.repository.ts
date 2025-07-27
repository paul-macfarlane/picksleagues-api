import { injectable } from "inversify";
import { DBOrTx, db } from "../../db/index.js";
import { DBPick, DBPickInsert, DBPickUpdate } from "./picks.types.js";
import { picksTable } from "../../db/schema.js";
import { and, eq, inArray } from "drizzle-orm";

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

  async findByUserIdAndLeagueIdAndEventId(
    userId: string,
    leagueId: string,
    eventId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPick | null> {
    const [pick] = await dbOrTx
      .select()
      .from(picksTable)
      .where(
        and(
          eq(picksTable.userId, userId),
          eq(picksTable.leagueId, leagueId),
          eq(picksTable.eventId, eventId),
        ),
      );
    return pick || null;
  }
}
