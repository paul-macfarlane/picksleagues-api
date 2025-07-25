import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeagueTypesRepository } from "./leagueTypes.repository.js";
import { DBLeagueType, LEAGUE_TYPE_SLUGS } from "./leagueTypes.types.js";

@injectable()
export class LeagueTypesQueryService {
  constructor(
    @inject(TYPES.LeagueTypesRepository)
    private leagueTypesRepository: LeagueTypesRepository,
  ) {}

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBLeagueType | null> {
    return this.leagueTypesRepository.findById(id, dbOrTx);
  }

  async findBySlug(
    slug: LEAGUE_TYPE_SLUGS,
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueType | null> {
    return this.leagueTypesRepository.findBySlug(slug, dbOrTx);
  }

  async listByIds(
    leagueTypeIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBLeagueType[]> {
    return this.leagueTypesRepository.listByIds(leagueTypeIds, dbOrTx);
  }
}
