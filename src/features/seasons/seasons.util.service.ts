import { inject, injectable } from "inversify";
import { SeasonsQueryService } from "./seasons.query.service.js";
import { TYPES } from "../../lib/inversify.types.js";
import { DBSeason } from "./seasons.types.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class SeasonsUtilService {
  constructor(
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
  ) {}

  async findCurrentOrLatestSeasonForSportLeagueId(
    sportLeagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBSeason | null> {
    const currentSeason =
      await this.seasonsQueryService.findCurrentBySportLeagueId(
        sportLeagueId,
        dbOrTx,
      );
    if (currentSeason) {
      return currentSeason;
    }

    const nextSeason = await this.seasonsQueryService.findLatestBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
    if (nextSeason) {
      return nextSeason;
    }

    return null;
  }
}
