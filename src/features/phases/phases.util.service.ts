import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { PhasesQueryService } from "./phases.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class PhasesUtilService {
  constructor(
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
  ) {}

  async getCurrentOrNextPhaseForLeagueForUser(
    userId: string,
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<{ id: string }> {
    // Verify user is a member of the league
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
      dbOrTx,
    );
    if (!member) {
      throw new ForbiddenError("You are not a member of this league");
    }

    // Get the league to find its phase templates
    const league = await this.leaguesQueryService.findById(leagueId, dbOrTx);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    // Find the current phase for the league
    const currentPhases = await this.phasesQueryService.findCurrentPhases(
      league.startPhaseTemplateId,
      league.endPhaseTemplateId,
      new Date(),
      dbOrTx,
    );

    if (currentPhases.length > 0) {
      // Return the first current phase (assuming one current phase per league)
      return { id: currentPhases[0].id };
    }

    // If no current phase, find the next phase
    const nextPhases = await this.phasesQueryService.findNextPhases(
      league.startPhaseTemplateId,
      league.endPhaseTemplateId,
      new Date(),
      dbOrTx,
    );

    if (nextPhases.length > 0) {
      // Return the first next phase
      return { id: nextPhases[0].id };
    }

    throw new NotFoundError("No current or next phase found for this league");
  }

  async getCurrentPhaseOnlyForLeague(
    userId: string,
    leagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<{ id: string }> {
    // Verify user is a member of the league
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
      dbOrTx,
    );
    if (!member) {
      throw new ForbiddenError("You are not a member of this league");
    }

    // Get the league to find its phase templates
    const league = await this.leaguesQueryService.findById(leagueId, dbOrTx);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    // Find the current phase for the league
    const currentPhases = await this.phasesQueryService.findCurrentPhases(
      league.startPhaseTemplateId,
      league.endPhaseTemplateId,
      new Date(),
      dbOrTx,
    );

    if (currentPhases.length > 0) {
      // Return the first current phase (assuming one current phase per league)
      return { id: currentPhases[0].id };
    }

    throw new NotFoundError("No current phase found for this league");
  }
}
