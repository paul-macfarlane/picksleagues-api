import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { EventsRepository } from "./events.repository.js";
import { DBEvent, DBExternalEvent } from "./events.types.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class EventsQueryService {
  constructor(
    @inject(TYPES.EventsRepository)
    private eventsRepository: EventsRepository,
  ) {}

  async findExternalByDataSourceIdAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalEvent | null> {
    return this.eventsRepository.findExternalByDataSourceIdAndExternalId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }

  async listExternalByDataSourceId(
    dataSourceId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalEvent[]> {
    return this.eventsRepository.listExternalByDataSourceId(
      dataSourceId,
      dbOrTx,
    );
  }

  async findExternalByDataSourceIdAndEventId(
    dataSourceId: string,
    eventId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalEvent | null> {
    return this.eventsRepository.findExternalByDataSourceIdAndEventId(
      dataSourceId,
      eventId,
      dbOrTx,
    );
  }

  async listByPhaseIds(
    phaseIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBEvent[]> {
    return this.eventsRepository.listByPhaseIds(phaseIds, dbOrTx);
  }

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBEvent | null> {
    return this.eventsRepository.findById(id, dbOrTx);
  }
}
