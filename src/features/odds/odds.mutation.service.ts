import { injectable, inject } from "inversify";
import { OddsRepository } from "./odds.repository";
import { DBOrTx } from "../../db";
import {
  DBOddsInsert,
  DBOddsUpdate,
  DBExternalOddsInsert,
  DBExternalOddsUpdate,
} from "./odds.types";
import { TYPES } from "../../lib/inversify.types";

@injectable()
export class OddsMutationService {
  constructor(
    @inject(TYPES.OddsRepository)
    private oddsRepository: OddsRepository,
  ) {}

  async create(values: DBOddsInsert, dbOrTx?: DBOrTx) {
    return this.oddsRepository.create(values, dbOrTx);
  }

  async createExternal(values: DBExternalOddsInsert, dbOrTx?: DBOrTx) {
    return this.oddsRepository.createExternal(values, dbOrTx);
  }

  async update(id: string, values: DBOddsUpdate, dbOrTx?: DBOrTx) {
    return this.oddsRepository.update(id, values, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    values: DBExternalOddsUpdate,
    dbOrTx?: DBOrTx,
  ) {
    return this.oddsRepository.updateExternal(
      dataSourceId,
      externalId,
      values,
      dbOrTx,
    );
  }
}
