import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { SportLeaguesRepository } from "./sportLeagues.repository.js";
import {
  DBExternalSportLeague,
  DBExternalSportLeagueInsert,
  DBExternalSportLeagueUpdate,
  DBSportLeague,
  DBSportLeagueInsert,
  DBSportLeagueUpdate,
} from "./sportLeagues.types.js";

@injectable()
export class SportLeaguesMutationService {
  constructor(
    @inject(TYPES.SportLeaguesRepository)
    private sportLeaguesRepository: SportLeaguesRepository,
  ) {}

  async create(
    data: DBSportLeagueInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBSportLeague> {
    return this.sportLeaguesRepository.create(data, dbOrTx);
  }

  async update(
    id: string,
    data: DBSportLeagueUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBSportLeague> {
    return this.sportLeaguesRepository.update(id, data, dbOrTx);
  }

  async createExternal(
    data: DBExternalSportLeagueInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague> {
    return this.sportLeaguesRepository.createExternal(data, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    data: DBExternalSportLeagueUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague> {
    return this.sportLeaguesRepository.updateExternal(
      dataSourceId,
      externalId,
      data,
      dbOrTx,
    );
  }
}
