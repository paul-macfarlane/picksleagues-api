import { injectable, inject } from "inversify";
import { db, DBOrTx } from "../../db";
import { DBSportLeague, DBExternalSportLeague } from "./sportLeagues.types";
import { TYPES } from "../../lib/inversify.types";
import { SportLeaguesRepository } from "./sportLeagues.repository";

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

  async findExternalBySourceAndId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague | null> {
    return this.sportLeaguesRepository.findExternalBySourceAndId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }

  async findExternalBySourceAndMetadata(
    dataSourceId: string,
    metadata: Record<string, string>,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportLeague | null> {
    return this.sportLeaguesRepository.findExternalBySourceAndMetadata(
      dataSourceId,
      metadata,
      dbOrTx,
    );
  }
}
