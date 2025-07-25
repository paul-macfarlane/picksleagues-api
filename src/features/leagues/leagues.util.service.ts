import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { DBLeague } from "./leagues.types.js";
import { DBOrTx } from "../../db/index.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";

@injectable()
export class LeaguesUtilService {
  constructor(
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
  ) {}

  async getLeagueCapacity(league: DBLeague, dbOrTx?: DBOrTx): Promise<number> {
    const members = await this.leagueMembersQueryService.listByLeagueId(
      league.id,
      dbOrTx,
    );
    return league.size - members.length;
  }

  async leagueSeasonInProgress(
    league: DBLeague,
    dbOrTx?: DBOrTx,
  ): Promise<boolean> {
    const now = new Date();
    const currentPhases = await this.phasesQueryService.findCurrentPhases(
      league.startPhaseTemplateId,
      league.endPhaseTemplateId,
      now,
      dbOrTx,
    );

    return currentPhases.length > 0;
  }
}
