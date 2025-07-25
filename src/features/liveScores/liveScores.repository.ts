import { injectable } from "inversify";
import { eq } from "drizzle-orm";
import { db, DBOrTx } from "../../db/index.js";
import { liveScoresTable } from "../../db/schema.js";
import {
  DBLiveScore,
  DBLiveScoreInsert,
  DBLiveScoreUpdate,
} from "./liveScores.types.js";

@injectable()
export class LiveScoresRepository {
  async findByEventId(
    eventId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLiveScore | null> {
    const liveScores = await dbOrTx
      .select()
      .from(liveScoresTable)
      .where(eq(liveScoresTable.eventId, eventId));
    return liveScores[0] || null;
  }

  async create(values: DBLiveScoreInsert, dbOrTx: DBOrTx = db) {
    const [liveScore] = await dbOrTx
      .insert(liveScoresTable)
      .values(values)
      .returning();
    return liveScore;
  }

  async update(
    eventId: string,
    values: DBLiveScoreUpdate,
    dbOrTx: DBOrTx = db,
  ) {
    const [liveScore] = await dbOrTx
      .update(liveScoresTable)
      .set(values)
      .where(eq(liveScoresTable.eventId, eventId))
      .returning();
    return liveScore;
  }
}
