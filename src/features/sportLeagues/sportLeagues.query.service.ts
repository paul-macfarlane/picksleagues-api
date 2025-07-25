import { injectable, inject } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { DBSportLeague, DBExternalSportLeague } from "./sportLeagues.types.js";
import { TYPES } from "../../lib/inversify.types.js";
import { SportLeaguesRepository } from "./sportLeagues.repository.js";

@injectable()
export class SportLeaguesQueryService {
  constructor(
    @inject(TYPES.SportLeaguesRepository)
    private sportLeaguesRepository: SportLeaguesRepository,
  ) {}

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBSportLeague | null> {
    return this.sportLeaguesRepository.findById(id, dbOrTx);
  }

  async findByName(
    name: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague | null> {
    return this.sportLeaguesRepository.findByName(name, dbOrTx);
  }

  async findExternalBySourceAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague | null> {
    return this.sportLeaguesRepository.findExternalBySourceAndExternalId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }

  async findExternalBySourceAndSportLeagueId(
    dataSourceId: string,
    sportLeagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague | null> {
    return this.sportLeaguesRepository.findExternalBySourceAndSportLeagueId(
      dataSourceId,
      sportLeagueId,
      dbOrTx,
    );
  }

  async list(dbOrTx?: DBOrTx): Promise<DBSportLeague[]> {
    return this.sportLeaguesRepository.list(dbOrTx);
  }

  async listExternalBySourceAndSportLeagueIds(
    dataSourceId: string,
    sportLeagueIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague[]> {
    return this.sportLeaguesRepository.listExternalBySourceAndSportLeagueIds(
      dataSourceId,
      sportLeagueIds,
      dbOrTx,
    );
  }
}
