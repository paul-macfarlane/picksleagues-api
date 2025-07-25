import { injectable, inject } from "inversify";
import { OddsRepository } from "./odds.repository.js";
import { DBOrTx } from "../../db/index.js";
import { DBOdds, DBExternalOdds } from "./odds.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class OddsQueryService {
  constructor(
    @inject(TYPES.OddsRepository)
    private oddsRepository: OddsRepository,
  ) {}

  async findByEventId(
    eventId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBOdds | null> {
    return this.oddsRepository.findByEventId(eventId, dbOrTx);
  }

  async findExternalByDataSourceIdAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalOdds | null> {
    return this.oddsRepository.findExternalByDataSourceIdAndExternalId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }
}
