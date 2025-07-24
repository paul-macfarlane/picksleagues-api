import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { SeasonsRepository } from "./seasons.repository";
import { DBExternalSeason, DBSeason } from "./seasons.types";

@injectable()
export class SeasonsQueryService {
  constructor(
    @inject(TYPES.SeasonsRepository)
    private seasonsRepository: SeasonsRepository,
  ) {}

  async findExternalBySourceAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSeason | null> {
    return this.seasonsRepository.findExternalBySourceAndExternalId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }

  async findExternalBySourceAndSeasonId(
    dataSourceId: string,
    seasonId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSeason | null> {
    return this.seasonsRepository.findExternalBySourceAndSeasonId(
      dataSourceId,
      seasonId,
      dbOrTx,
    );
  }

  async findCurrentBySportLeagueId(
    sportLeagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBSeason | null> {
    return this.seasonsRepository.findCurrentBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
  }

  async findCurrentBySportLeagueIds(
    sportLeagueIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBSeason[]> {
    return this.seasonsRepository.findCurrentBySportLeagueIds(
      sportLeagueIds,
      dbOrTx,
    );
  }

  async findLatestBySportLeagueId(
    sportLeagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBSeason | null> {
    return this.seasonsRepository.findLatestBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
  }

  async findLatestBySportLeagueIds(
    sportLeagueIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBSeason[]> {
    return this.seasonsRepository.findLatestBySportLeagueIds(
      sportLeagueIds,
      dbOrTx,
    );
  }

  async listExternalBySeasonIds(
    seasonIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSeason[]> {
    return this.seasonsRepository.listExternalBySeasonIds(seasonIds, dbOrTx);
  }
}
