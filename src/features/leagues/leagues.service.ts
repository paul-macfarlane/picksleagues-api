import { db, DBOrTx } from "../../db/index.js";
import {
  CreateLeagueSchema,
  DBLeague,
  PopulatedDBLeague,
  LeagueIncludeSchema,
  LEAGUE_INCLUDES,
  UpdateLeagueSchema,
} from "./leagues.types.js";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { z } from "zod";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service.js";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types.js";
import { LeaguesMutationService } from "./leagues.mutation.service.js";
import { LeaguesQueryService } from "./leagues.query.service.js";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service.js";
import {
  DBLeagueType,
  LEAGUE_TYPE_SLUGS,
  LeagueTypeIdSchema,
} from "../leagueTypes/leagueTypes.types.js";
import { DBLeagueMember } from "../leagueMembers/leagueMembers.types.js";
import { LeaguesUtilService } from "./leagues.util.service.js";

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
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.PhaseTemplatesQueryService)
    private phaseTemplatesQueryService: PhaseTemplatesQueryService,
    @inject(TYPES.LeaguesUtilService)
    private leaguesUtilService: LeaguesUtilService,
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

  async update(
    userId: string,
    leagueId: string,
    update: z.infer<typeof UpdateLeagueSchema>,
  ): Promise<DBLeague> {
    return db.transaction(async (tx) => {
      const league = await this.leaguesQueryService.findById(leagueId, tx);
      if (!league) {
        throw new NotFoundError("League not found");
      }

      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }
      if (member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
        throw new ForbiddenError(
          "You must be a commissioner to edit this league's settings",
        );
      }

      const isInSeason = await this.leaguesUtilService.leagueSeasonInProgress(
        league,
        tx,
      );

      const updateToMake: Partial<DBLeague> = {
        name: update.name,
        image: update.image,
      };

      if (isInSeason) {
        if (
          update.startPhaseTemplateId ||
          update.endPhaseTemplateId ||
          update.size ||
          update.settings
        ) {
          throw new ForbiddenError(
            "Some settings cannot be changed while the league is in season.",
          );
        }
      } else {
        updateToMake.startPhaseTemplateId = update.startPhaseTemplateId;
        updateToMake.endPhaseTemplateId = update.endPhaseTemplateId;
        updateToMake.settings = update.settings;

        if (update.size) {
          const members = await this.leagueMembersQueryService.listByLeagueId(
            leagueId,
            tx,
          );
          if (update.size < members.length) {
            throw new ValidationError(
              "League size cannot be smaller than the current number of members.",
            );
          }
          updateToMake.size = update.size;
        }
      }

      const updatedLeague = await this.leaguesMutationService.update(
        leagueId,
        updateToMake,
        tx,
      );
      return updatedLeague;
    });
  }

  async delete(userId: string, leagueId: string): Promise<void> {
    return db.transaction(async (tx) => {
      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }
      if (member.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER) {
        throw new ForbiddenError(
          "You must be a commissioner to delete this league",
        );
      }

      // only need to delete the league, the other data will be deleted by cascade
      await this.leaguesMutationService.delete(leagueId, tx);
    });
  }

  private async populateLeagues(
    leagues: DBLeague[],
    query: z.infer<typeof LeagueIncludeSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<PopulatedDBLeague[]> {
    const populatedLeagues: PopulatedDBLeague[] = leagues;
    const leagueIds = populatedLeagues.map((l) => l.id);

    if (query?.include) {
      const includes = query.include as string[];
      if (includes.includes(LEAGUE_INCLUDES.LEAGUE_TYPE)) {
        const leagueTypeByIdMap = new Map<string, DBLeagueType>();
        for (const league of populatedLeagues) {
          let leagueType = leagueTypeByIdMap.get(league.leagueTypeId) ?? null;
          if (!leagueType) {
            leagueType = await this.leagueTypesQueryService.findById(
              league.leagueTypeId,
              dbOrTx,
            );
            if (leagueType) {
              leagueTypeByIdMap.set(league.leagueTypeId, leagueType);
            }
          }
          league.leagueType = leagueTypeByIdMap.get(league.leagueTypeId);
        }
      }

      if (includes.includes(LEAGUE_INCLUDES.MEMBERS)) {
        const members = await this.leagueMembersQueryService.listByLeagueIds(
          leagueIds,
          dbOrTx,
        );
        const membersByLeagueId = members.reduce(
          (acc, member) => {
            if (!acc[member.leagueId]) {
              acc[member.leagueId] = [];
            }
            acc[member.leagueId].push(member);
            return acc;
          },
          {} as Record<string, DBLeagueMember[]>,
        );

        for (const league of populatedLeagues) {
          league.members = membersByLeagueId[league.id] || [];
        }
      }

      if (includes.includes(LEAGUE_INCLUDES.IS_IN_SEASON)) {
        for (const league of populatedLeagues) {
          league.isInSeason =
            await this.leaguesUtilService.leagueSeasonInProgress(league);
        }
      }
    }

    return populatedLeagues;
  }

  async listLeaguesForUser(
    userId: string,
    query: z.infer<typeof LeagueIncludeSchema>,
  ): Promise<PopulatedDBLeague[]> {
    const leagues = await this.leaguesQueryService.listByUserId(userId);
    return this.populateLeagues(leagues, query);
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

    const populatedLeague = await this.populateLeagues([league], query);
    return populatedLeague[0];
  }

  async listByUserIdAndLeagueTypeIdOrSlug(
    userId: string,
    typeIdOrSlug: string,
    query: z.infer<typeof LeagueIncludeSchema>,
    dbOrTx?: DBOrTx,
  ): Promise<PopulatedDBLeague[]> {
    const isId = LeagueTypeIdSchema.safeParse(typeIdOrSlug).success;

    let leagueType: DBLeagueType | null = null;
    if (isId) {
      leagueType = await this.leagueTypesQueryService.findById(
        typeIdOrSlug,
        dbOrTx,
      );
    } else {
      leagueType = await this.leagueTypesQueryService.findBySlug(
        typeIdOrSlug as LEAGUE_TYPE_SLUGS,
        dbOrTx,
      );
    }

    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    let leagues: DBLeague[] = [];
    if (isId) {
      leagues = await this.leaguesQueryService.listByUserIdAndLeagueTypeId(
        userId,
        leagueType.id,
        dbOrTx,
      );
    } else {
      leagues = await this.leaguesQueryService.listByUserIdAndLeagueTypeSlug(
        userId,
        leagueType.slug,
        dbOrTx,
      );
    }

    return this.populateLeagues(leagues, query, dbOrTx);
  }
}
