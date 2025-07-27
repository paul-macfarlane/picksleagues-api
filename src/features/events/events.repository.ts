import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import {
  DBEvent,
  DBEventInsert,
  DBEventUpdate,
  DBExternalEvent,
  DBExternalEventInsert,
  DBExternalEventUpdate,
} from "./events.types.js";
import { eventsTable, externalEventsTable } from "../../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";

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

  async findExternalByDataSourceIdAndEventId(
    dataSourceId: string,
    eventId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalEvent | null> {
    const externalEvents = await dbOrTx
      .select()
      .from(externalEventsTable)
      .where(
        and(
          eq(externalEventsTable.dataSourceId, dataSourceId),
          eq(externalEventsTable.eventId, eventId),
        ),
      );
    return externalEvents[0] || null;
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

  async listByPhaseIds(
    phaseIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBEvent[]> {
    if (phaseIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(eventsTable)
      .where(inArray(eventsTable.phaseId, phaseIds));
  }

  async findById(id: string, dbOrTx: DBOrTx = db): Promise<DBEvent | null> {
    const [event] = await dbOrTx
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id));
    return event || null;
  }
}
