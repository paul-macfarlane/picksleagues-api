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

  async createExternal(
    event: DBExternalEventInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent> {
    const createdExternalEvent = await dbOrTx
      .insert(externalEventsTable)
      .values(event)
      .returning();

    return createdExternalEvent[0];
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    event: DBExternalEventUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent> {
    const updatedExternalEvent = await dbOrTx
      .update(externalEventsTable)
      .set(event)
      .where(
        and(
          eq(externalEventsTable.externalId, externalId),
          eq(externalEventsTable.dataSourceId, dataSourceId),
        ),
      )
      .returning();

    return updatedExternalEvent[0];
  }

  async create(event: DBEventInsert, dbOrTx: DBOrTx = db): Promise<DBEvent> {
    const createdEvent = await dbOrTx
      .insert(eventsTable)
      .values(event)
      .returning();

    return createdEvent[0];
  }

  async update(
    id: string,
    event: DBEventUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBEvent> {
    const updatedEvent = await dbOrTx
      .update(eventsTable)
      .set(event)
      .where(eq(eventsTable.id, id))
      .returning();

    return updatedEvent[0];
  }
}
