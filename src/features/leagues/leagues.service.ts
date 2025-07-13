import { z } from "zod";
import { db } from "../../db";
import {
  CreateLeagueSchema,
  DBLeague,
  DBLeagueWithLeagueType,
} from "./leagues.types";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { DBLeagueInviteWithLeagueAndType } from "../leagueInvites/leagueInvites.types";
import {
  DBLeagueMember,
  DBLeagueMemberWithProfile,
} from "../leagueMembers/leagueMembers.types";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesRepository } from "./leagues.repository";
import { LeagueMembersService } from "../leagueMembers/leagueMembers.service";
import { LeagueTypesService } from "../leagueTypes/leagueTypes.service";
import { PhaseTemplatesService } from "../phaseTemplates/phaseTemplates.service";
import { LeagueInvitesService } from "../leagueInvites/leagueInvites.service";

@injectable()
export class LeaguesService {
  constructor(
    @inject(TYPES.LeaguesRepository)
    private leaguesRepository: LeaguesRepository,
    @inject(TYPES.LeagueMembersService)
    private leagueMembersService: LeagueMembersService,
    @inject(TYPES.LeagueTypesService)
    private leagueTypesService: LeagueTypesService,
    @inject(TYPES.PhaseTemplatesService)
    private phaseTemplatesService: PhaseTemplatesService,
    @inject(TYPES.LeagueInvitesService)
    private leagueInvitesService: LeagueInvitesService,
  ) {}

  async create(
    userId: string,
    leagueData: z.infer<typeof CreateLeagueSchema>,
  ): Promise<DBLeague> {
    return await db.transaction(async (tx) => {
      const leagueType = await this.leagueTypesService.findByIdOrSlug(
        leagueData.leagueTypeSlug,
        tx,
      );
      if (!leagueType) {
        throw new NotFoundError("League type not found");
      }

      const startPhaseTemplate = await this.phaseTemplatesService.findById(
        leagueData.startPhaseTemplateId,
        tx,
      );
      if (!startPhaseTemplate) {
        throw new NotFoundError("Start phase template not found");
      }

      const endPhaseTemplate = await this.phaseTemplatesService.findById(
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

      const league = await this.leaguesRepository.create(
        {
          name: leagueData.name,
          visibility: leagueData.visibility,
          size: leagueData.size,
          image: leagueData.image,
          leagueTypeId: leagueType.id,
          startPhaseTemplateId: leagueData.startPhaseTemplateId,
          endPhaseTemplateId: leagueData.endPhaseTemplateId,
          settings: leagueData.settings,
        },
        tx,
      );

      await this.leagueMembersService.createLeagueMember(
        {
          leagueId: league.id,
          userId: userId,
          role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
        },
        tx,
      );

      return league;
    });
  }

  async getForUserById(
    userId: string,
    leagueId: string,
    options?: { include?: "leagueType"[] },
  ): Promise<DBLeagueWithLeagueType | DBLeague> {
    const league = await this.leaguesRepository.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    const member = await this.leagueMembersService.findByLeagueAndUserId(
      leagueId,
      userId,
    );
    if (!member) {
      throw new NotFoundError("League not found");
    }

    if (options?.include?.includes("leagueType")) {
      const leagueType = await this.leagueTypesService.getByIdOrSlug(
        league.leagueTypeId,
      );
      return { ...league, leagueType };
    }

    return league;
  }

  async listMembersForUserById(
    userId: string,
    leagueId: string,
    options?: { include?: "profile"[] },
  ): Promise<(DBLeagueMember | DBLeagueMemberWithProfile)[]> {
    // will throw if league not found or user not a member
    await this.getForUserById(userId, leagueId);
    return await this.leagueMembersService.listByLeagueId(leagueId, options);
  }

  async listPendingInvitesForUserByIdWithLeagueAndType(
    userId: string,
    leagueId: string,
  ): Promise<DBLeagueInviteWithLeagueAndType[]> {
    // will throw if league not found or user not a member
    await this.getForUserById(userId, leagueId);
    return await this.leagueInvitesService.listPendingByLeagueIdWithLeagueAndType(
      leagueId,
    );
  }

  async listByUserIdAndLeagueTypeId(
    userId: string,
    leagueTypeId: string,
  ): Promise<DBLeague[]> {
    return await this.leaguesRepository.findByUserIdAndLeagueTypeId(
      userId,
      leagueTypeId,
    );
  }

  async listForUserByIdAndLeagueTypeIdOrSlug(
    userId: string,
    typeIdOrSlug: string,
  ): Promise<DBLeague[]> {
    const leagueType =
      await this.leagueTypesService.findByIdOrSlug(typeIdOrSlug);
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    return await this.listByUserIdAndLeagueTypeId(userId, leagueType.id);
  }
}
