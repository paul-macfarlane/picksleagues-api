import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesRepository } from "./leagues.repository";
import { DBLeague } from "./leagues.types";

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
}
