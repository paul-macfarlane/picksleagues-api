import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeaguesRepository } from "./leagues.repository.js";
import { DBLeague } from "./leagues.types.js";
import { LEAGUE_TYPE_SLUGS } from "../leagueTypes/leagueTypes.types.js";

@injectable()
export class LeaguesQueryService {
  constructor(
    @inject(TYPES.LeaguesRepository)
    private leaguesRepository: LeaguesRepository,
  ) {}

  async findById(leagueId: string, dbOrTx?: DBOrTx): Promise<DBLeague | null> {
    return this.leaguesRepository.findById(leagueId, dbOrTx);
  }

  async listByIds(leagueIds: string[], dbOrTx?: DBOrTx): Promise<DBLeague[]> {
    return this.leaguesRepository.listByIds(leagueIds, dbOrTx);
  }

  async listByUserIdAndLeagueTypeId(
    userId: string,
    typeIdOrSlug: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeague[]> {
    return this.leaguesRepository.listByUserIdAndLeagueTypeId(
      userId,
      typeIdOrSlug,
      dbOrTx,
    );
  }

  async listByUserIdAndLeagueTypeSlug(
    userId: string,
    leagueTypeSlug: LEAGUE_TYPE_SLUGS,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeague[]> {
    return this.leaguesRepository.listByUserIdAndLeagueTypeSlug(
      userId,
      leagueTypeSlug,
      dbOrTx,
    );
  }

  async listByUserId(userId: string, dbOrTx?: DBOrTx): Promise<DBLeague[]> {
    return this.leaguesRepository.listByUserId(userId, dbOrTx);
  }
}
