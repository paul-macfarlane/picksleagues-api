import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { LeaguesRepository } from "./leagues.repository.js";
import { DBOrTx, db } from "../../db/index.js";
import { DBLeague, DBLeagueInsert, DBLeagueUpdate } from "./leagues.types.js";

@injectable()
export class LeaguesMutationService {
  constructor(
    @inject(TYPES.LeaguesRepository)
    private leaguesRepository: LeaguesRepository,
  ) {}

  async create(league: DBLeagueInsert, dbOrTx: DBOrTx = db): Promise<DBLeague> {
    return this.leaguesRepository.create(league, dbOrTx);
  }

  async update(
    id: string,
    league: DBLeagueUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeague> {
    return this.leaguesRepository.update(id, league, dbOrTx);
  }

  async delete(id: string, dbOrTx: DBOrTx = db): Promise<void> {
    return this.leaguesRepository.delete(id, dbOrTx);
  }
}
