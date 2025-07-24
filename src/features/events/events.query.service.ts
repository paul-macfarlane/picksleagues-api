import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { EventsRepository } from "./events.repository";
import { DBExternalEvent } from "./events.types";
import { DBOrTx } from "../../db";

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
}
