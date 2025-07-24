import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import {
  DBEvent,
  DBEventInsert,
  DBEventUpdate,
  DBExternalEvent,
  DBExternalEventInsert,
  DBExternalEventUpdate,
} from "./events.types";
import { eventsTable, externalEventsTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";

@injectable()
export class EventsRepository {
  async findExternalByDataSourceIdAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent | null> {
    const externalEvents = await dbOrTx
      .select()
      .from(externalEventsTable)
      .where(
        and(
          eq(externalEventsTable.externalId, externalId),
          eq(externalEventsTable.dataSourceId, dataSourceId),
        ),
      );

    return externalEvents[0] || null;
  }

  async listExternalByDataSourceId(
    dataSourceId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent[]> {
    return dbOrTx
      .select()
      .from(externalEventsTable)
      .where(eq(externalEventsTable.dataSourceId, dataSourceId));
  }

  async createExternal(
    values: DBExternalEventInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent> {
    const createdExternalEvent = await dbOrTx
      .insert(externalEventsTable)
      .values(values)
      .returning();

    return createdExternalEvent[0];
  }

  async bulkCreateExternal(
    values: DBExternalEventInsert[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent[]> {
    return dbOrTx.insert(externalEventsTable).values(values).returning();
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    values: DBExternalEventUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent> {
    const updatedExternalEvent = await dbOrTx
      .update(externalEventsTable)
      .set(values)
      .where(
        and(
          eq(externalEventsTable.externalId, externalId),
          eq(externalEventsTable.dataSourceId, dataSourceId),
        ),
      )
      .returning();

    return updatedExternalEvent[0];
  }

  async create(values: DBEventInsert, dbOrTx: DBOrTx = db): Promise<DBEvent> {
    const createdEvent = await dbOrTx
      .insert(eventsTable)
      .values(values)
      .returning();

    return createdEvent[0];
  }

  async bulkCreate(
    values: DBEventInsert[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBEvent[]> {
    return dbOrTx.insert(eventsTable).values(values).returning();
  }

  async update(
    id: string,
    values: DBEventUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBEvent> {
    const updatedEvent = await dbOrTx
      .update(eventsTable)
      .set(values)
      .where(eq(eventsTable.id, id))
      .returning();

    return updatedEvent[0];
  }
}
