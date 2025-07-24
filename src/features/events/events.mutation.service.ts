import { inject, injectable } from "inversify";
import {
  DBEventInsert,
  DBExternalEventInsert,
  DBEventUpdate,
  DBExternalEventUpdate,
} from "./events.types";
import { EventsRepository } from "./events.repository";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";

@injectable()
export class EventsMutationService {
  constructor(
    @inject(TYPES.EventsRepository)
    private eventsRepository: EventsRepository,
  ) {}

  async create(values: DBEventInsert, dbOrTx?: DBOrTx) {
    return this.eventsRepository.create(values, dbOrTx);
  }

  async update(id: string, values: DBEventUpdate, dbOrTx?: DBOrTx) {
    return this.eventsRepository.update(id, values, dbOrTx);
  }

  async bulkCreate(values: DBEventInsert[], dbOrTx?: DBOrTx) {
    return this.eventsRepository.bulkCreate(values, dbOrTx);
  }

  async createExternal(values: DBExternalEventInsert, dbOrTx?: DBOrTx) {
    return this.eventsRepository.createExternal(values, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    values: DBExternalEventUpdate,
    dbOrTx?: DBOrTx,
  ) {
    return this.eventsRepository.updateExternal(
      dataSourceId,
      externalId,
      values,
      dbOrTx,
    );
  }

  async bulkCreateExternal(values: DBExternalEventInsert[], dbOrTx?: DBOrTx) {
    return this.eventsRepository.bulkCreateExternal(values, dbOrTx);
  }
}
