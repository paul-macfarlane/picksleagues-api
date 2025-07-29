import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { StandingsRepository } from "./standings.repository.js";
import { DBStandings } from "./standings.types.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class StandingsQueryService {
  constructor(
    @inject(TYPES.StandingsRepository)
    private standingsRepository: StandingsRepository,
  ) {}

  async findByUserLeagueSeason(
    userId: string,
    leagueId: string,
    seasonId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBStandings | null> {
    return this.standingsRepository.findByUserLeagueSeason(
      userId,
      leagueId,
      seasonId,
      dbOrTx,
    );
  }

  async findByLeagueSeason(
    leagueId: string,
    seasonId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBStandings[]> {
    return this.standingsRepository.findByLeagueSeason(
      leagueId,
      seasonId,
      dbOrTx,
    );
  }
}
