import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesRepository } from "./leagues.repository";
import { DBOrTx, db } from "../../../src/db";
import { DBLeague, DBLeagueInsert } from "./leagues.types";

@injectable()
export class LeaguesMutationService {
  constructor(
    @inject(TYPES.LeaguesRepository)
    private leaguesRepository: LeaguesRepository,
  ) {}

  async create(league: DBLeagueInsert, dbOrTx: DBOrTx = db): Promise<DBLeague> {
    return this.leaguesRepository.create(league, dbOrTx);
  }
}
