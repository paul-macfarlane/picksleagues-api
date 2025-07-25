import { injectable } from "inversify";
import { eq } from "drizzle-orm";
import { db, DBOrTx } from "../../db";
import { outcomesTable } from "../../db/schema";
import { DBOutcome, DBOutcomeInsert, DBOutcomeUpdate } from "./outcomes.types";

@injectable()
export class OutcomesRepository {
  async findByEventId(
    eventId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBOutcome | null> {
    const outcomes = await dbOrTx
      .select()
      .from(outcomesTable)
      .where(eq(outcomesTable.eventId, eventId));
    return outcomes[0] || null;
  }

  async create(values: DBOutcomeInsert, dbOrTx: DBOrTx = db) {
    const [outcome] = await dbOrTx
      .insert(outcomesTable)
      .values(values)
      .returning();
    return outcome;
  }

  async update(eventId: string, values: DBOutcomeUpdate, dbOrTx: DBOrTx = db) {
    const [outcome] = await dbOrTx
      .update(outcomesTable)
      .set(values)
      .where(eq(outcomesTable.eventId, eventId))
      .returning();
    return outcome;
  }
}
