import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { EventsRepository } from "./events.repository";
import { DBOrTx } from "../../db";
import {
  DBEvent,
  DBEventInsert,
  DBEventUpdate,
  DBExternalEvent,
  DBExternalEventInsert,
  DBExternalEventUpdate,
} from "./events.types";

@injectable()
export class EventsMutationService {
  constructor(
    @inject(TYPES.EventsRepository)
    private eventsRepository: EventsRepository,
  ) {}

  async createExternal(
    event: DBExternalEventInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalEvent> {
    return this.eventsRepository.createExternal(event, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    event: DBExternalEventUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalEvent> {
    return this.eventsRepository.updateExternal(
      dataSourceId,
      externalId,
      event,
      dbOrTx,
    );
  }

  async create(event: DBEventInsert, dbOrTx?: DBOrTx): Promise<DBEvent> {
    return this.eventsRepository.create(event, dbOrTx);
  }

  async update(
    id: string,
    event: DBEventUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBEvent> {
    return this.eventsRepository.update(id, event, dbOrTx);
  }
}
