import { injectable } from "inversify";
import { eq, and } from "drizzle-orm";
import { db, DBOrTx } from "../../db/index.js";
import { oddsTable, externalOddsTable } from "../../db/schema.js";
import {
  DBOdds,
  DBOddsInsert,
  DBOddsUpdate,
  DBExternalOdds,
  DBExternalOddsInsert,
  DBExternalOddsUpdate,
} from "./odds.types.js";

@injectable()
export class OddsRepository {
  async findByEventId(
    eventId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBOdds | null> {
    const odds = await dbOrTx
      .select()
      .from(oddsTable)
      .where(eq(oddsTable.eventId, eventId));
    return odds[0] || null;
  }

  async findExternalByDataSourceIdAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalOdds | null> {
    const externalOdds = await dbOrTx
      .select()
      .from(externalOddsTable)
      .where(
        and(
          eq(externalOddsTable.dataSourceId, dataSourceId),
          eq(externalOddsTable.externalId, externalId),
        ),
      );
    return externalOdds[0] || null;
  }

  async create(values: DBOddsInsert, dbOrTx: DBOrTx = db) {
    const [odds] = await dbOrTx.insert(oddsTable).values(values).returning();
    return odds;
  }

  async createExternal(values: DBExternalOddsInsert, dbOrTx: DBOrTx = db) {
    const [externalOdds] = await dbOrTx
      .insert(externalOddsTable)
      .values(values)
      .returning();
    return externalOdds;
  }

  async update(id: string, values: DBOddsUpdate, dbOrTx: DBOrTx = db) {
    const [odds] = await dbOrTx
      .update(oddsTable)
      .set(values)
      .where(eq(oddsTable.id, id))
      .returning();
    return odds;
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    values: DBExternalOddsUpdate,
    dbOrTx: DBOrTx = db,
  ) {
    const [externalOdds] = await dbOrTx
      .update(externalOddsTable)
      .set(values)
      .where(
        and(
          eq(externalOddsTable.dataSourceId, dataSourceId),
          eq(externalOddsTable.externalId, externalId),
        ),
      )
      .returning();
    return externalOdds;
  }
}
