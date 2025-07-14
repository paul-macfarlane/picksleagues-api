import { db } from "../../db";
import {
  CreateLeagueSchema,
  DBLeague,
  PopulatedDBLeague,
  LeagueIncludeSchema,
  LEAGUE_INCLUDES,
} from "./leagues.types";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import { LeagueInvitesQueryService } from "../leagueInvites/leagueInvites.query.service";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service";
import { z } from "zod";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types";
import { LeaguesMutationService } from "./leagues.mutation.service";
import { LeaguesQueryService } from "./leagues.query.service";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service";

@injectable()
export class LeaguesService {
  constructor(
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeaguesMutationService)
    private leaguesMutationService: LeaguesMutationService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.LeagueMembersMutationService)
    private leagueMembersMutationService: LeagueMembersMutationService,
    @inject(TYPES.LeagueInvitesQueryService)
    private leagueInvitesQueryService: LeagueInvitesQueryService,
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.PhaseTemplatesQueryService)
    private phaseTemplatesQueryService: PhaseTemplatesQueryService,
  ) {}

  async create(
    userId: string,
    leagueData: z.infer<typeof CreateLeagueSchema>,
  ): Promise<DBLeague> {
    return db.transaction(async (tx) => {
      const leagueType = await this.leagueTypesQueryService.findBySlug(
        leagueData.leagueTypeSlug,
        tx,
      );
      if (!leagueType) {
        throw new NotFoundError("League type not found");
      }

      const startPhaseTemplate = await this.phaseTemplatesQueryService.findById(
        leagueData.startPhaseTemplateId,
        tx,
      );
      if (!startPhaseTemplate) {
        throw new NotFoundError("Start phase template not found");
      }

      const endPhaseTemplate = await this.phaseTemplatesQueryService.findById(
        leagueData.endPhaseTemplateId,
        tx,
      );
      if (!endPhaseTemplate) {
        throw new NotFoundError("End phase template not found");
      }

      if (startPhaseTemplate.sequence > endPhaseTemplate.sequence) {
        throw new ValidationError(
          "Start phase must be before or equal to end phase",
        );
      }

      const newLeague = await this.leaguesMutationService.create(
        {
          ...leagueData,
          leagueTypeId: leagueType.id,
        },
        tx,
      );
      await this.leagueMembersMutationService.createLeagueMember(
        {
          userId,
          leagueId: newLeague.id,
          role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
        },
        tx,
      );
      return newLeague;
    });
  }

  private async populateLeague(
    league: DBLeague,
    query: z.infer<typeof LeagueIncludeSchema>,
  ): Promise<PopulatedDBLeague> {
    const populatedLeague: PopulatedDBLeague = league;
    if (query?.include?.includes(LEAGUE_INCLUDES.LEAGUE_TYPE)) {
      const leagueType = await this.leagueTypesQueryService.findById(
        league.leagueTypeId,
      );
      populatedLeague.leagueType = leagueType ?? undefined;
    }

    return populatedLeague;
  }

  async getByIdForUser(
    userId: string,
    leagueId: string,
    query: z.infer<typeof LeagueIncludeSchema>,
  ): Promise<PopulatedDBLeague> {
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("You are not a member of this league");
    }

    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      // This should be rare, as a member existing implies a league exists.
      throw new ForbiddenError("You are not a member of this league");
    }

    return this.populateLeague(league, query);
  }
}
