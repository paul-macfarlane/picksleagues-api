import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { SeasonsRepository } from "./seasons.repository";
import {
  DBExternalSeason,
  DBExternalSeasonInsert,
  DBSeason,
  DBSeasonInsert,
  DBSeasonUpdate,
} from "./seasons.types";

@injectable()
export class SeasonsMutationService {
  constructor(
    @inject(TYPES.SeasonsRepository)
    private seasonsRepository: SeasonsRepository,
  ) {}

  async create(data: DBSeasonInsert, dbOrTx?: DBOrTx): Promise<DBSeason> {
    return this.seasonsRepository.create(data, dbOrTx);
  }

  async update(
    id: string,
    data: DBSeasonUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBSeason> {
    return this.seasonsRepository.update(id, data, dbOrTx);
  }

  async createExternal(
    data: DBExternalSeasonInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSeason> {
    return this.seasonsRepository.createExternal(data, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    data: Partial<DBExternalSeasonInsert>,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSeason> {
    return this.seasonsRepository.updateExternal(
      dataSourceId,
      externalId,
      data,
      dbOrTx,
    );
  }
}
