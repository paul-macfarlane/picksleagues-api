import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { StandingsRepository } from "./standings.repository.js";
import { DBStandingsInsert, DBStandingsUpdate } from "./standings.types.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class StandingsMutationService {
  constructor(
    @inject(TYPES.StandingsRepository)
    private standingsRepository: StandingsRepository,
  ) {}

  async create(data: DBStandingsInsert, dbOrTx?: DBOrTx): Promise<void> {
    await this.standingsRepository.create(data, dbOrTx);
  }

  async update(
    userId: string,
    leagueId: string,
    seasonId: string,
    data: DBStandingsUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<void> {
    await this.standingsRepository.update(
      userId,
      leagueId,
      seasonId,
      data,
      dbOrTx,
    );
  }

  async deleteByUserLeagueSeason(
    userId: string,
    leagueId: string,
    seasonId: string,
    dbOrTx?: DBOrTx,
  ): Promise<void> {
    await this.standingsRepository.deleteByUserLeagueSeason(
      userId,
      leagueId,
      seasonId,
      dbOrTx,
    );
  }
}
