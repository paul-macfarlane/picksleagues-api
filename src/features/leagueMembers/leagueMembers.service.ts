import { inject, injectable } from "inversify";
import { z } from "zod";
import { TYPES } from "../../lib/inversify.types.js";
import {
  DBLeagueMember,
  DBLeagueMemberWithProfile,
  LEAGUE_MEMBER_ROLES,
  LeagueMemberIncludeSchema,
  PopulatedDBLeagueMember,
  UpdateLeagueMemberSchema,
} from "./leagueMembers.types.js";
import { LeagueMembersMutationService } from "./leagueMembers.mutation.service.js";
import { LeagueMembersQueryService } from "./leagueMembers.query.service.js";
import { LeaguesUtilService } from "../leagues/leagues.util.service.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeaguesMutationService } from "../leagues/leagues.mutation.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { db } from "../../db/index.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { StandingsMutationService } from "../standings/standings.mutation.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";

@injectable()
export class LeagueMembersService {
  constructor(
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.LeagueMembersMutationService)
    private leagueMembersMutationService: LeagueMembersMutationService,
    @inject(TYPES.LeaguesUtilService)
    private leaguesUtilService: LeaguesUtilService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeaguesMutationService)
    private leaguesMutationService: LeaguesMutationService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.StandingsMutationService)
    private standingsMutationService: StandingsMutationService,
    @inject(TYPES.SeasonsUtilService)
    private seasonsUtilService: SeasonsUtilService,
  ) {}

  private async populateMembers(
    members: DBLeagueMember[],
    query: z.infer<typeof LeagueMemberIncludeSchema>,
  ): Promise<PopulatedDBLeagueMember[]> {
    if (!query?.include?.includes("profile")) {
      return members;
    }
    const userIds = members.map((member) => member.userId);
    const profiles = await this.profilesQueryService.listByUserIds(userIds);
    const profilesByUserId = new Map(profiles.map((p) => [p.userId, p]));
    const populatedMembers: DBLeagueMemberWithProfile[] = members.map(
      (member) => ({
        ...member,
        profile: profilesByUserId.get(member.userId)!,
      }),
    );
    return populatedMembers;
  }

  async listByLeagueIdForUser(
    userId: string,
    leagueId: string,
    query: z.infer<typeof LeagueMemberIncludeSchema>,
  ): Promise<PopulatedDBLeagueMember[]> {
    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
    );
    if (!member) {
      throw new NotFoundError("User is not a member of the league");
    }

    const members =
      await this.leagueMembersQueryService.listByLeagueId(leagueId);
    return this.populateMembers(members, query);
  }

  async update(
    actingUserId: string,
    leagueId: string,
    targetUserId: string,
    update: z.infer<typeof UpdateLeagueMemberSchema>,
  ): Promise<DBLeagueMember> {
    const actingUserMember =
      await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        actingUserId,
      );
    if (
      !actingUserMember ||
      actingUserMember.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER
    ) {
      throw new ForbiddenError(
        "You are not authorized to update members in this league",
      );
    }

    const targetUserMember =
      await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        targetUserId,
      );
    if (!targetUserMember) {
      throw new NotFoundError("Target user is not a member of this league");
    }

    if (actingUserId === targetUserId) {
      const allMembers =
        await this.leagueMembersQueryService.listByLeagueId(leagueId);
      const commissioners = allMembers.filter(
        (m) => m.role === LEAGUE_MEMBER_ROLES.COMMISSIONER,
      );
      if (
        commissioners.length === 1 &&
        update.role === LEAGUE_MEMBER_ROLES.MEMBER
      ) {
        throw new ValidationError(
          "You cannot change your own role to member if you are the sole commissioner",
        );
      }
    }

    return this.leagueMembersMutationService.update(
      leagueId,
      targetUserId,
      update,
    );
  }

  async removeMember(
    actingUserId: string,
    leagueId: string,
    targetUserId: string,
  ): Promise<void> {
    return db.transaction(async (tx) => {
      const actingUserMember =
        await this.leagueMembersQueryService.findByLeagueAndUserId(
          leagueId,
          actingUserId,
          tx,
        );
      if (
        !actingUserMember ||
        actingUserMember.role !== LEAGUE_MEMBER_ROLES.COMMISSIONER
      ) {
        throw new ForbiddenError(
          "You are not authorized to remove members from this league",
        );
      }

      if (actingUserId === targetUserId) {
        throw new ValidationError("You cannot remove yourself from the league");
      }

      const targetUserMember =
        await this.leagueMembersQueryService.findByLeagueAndUserId(
          leagueId,
          targetUserId,
          tx,
        );
      if (!targetUserMember) {
        throw new NotFoundError("Target user is not a member of this league");
      }

      const league = await this.leaguesQueryService.findById(leagueId, tx);
      if (!league) {
        throw new NotFoundError("League not found");
      }

      const leagueIsInProgress =
        await this.leaguesUtilService.leagueSeasonInProgress(league, tx);
      if (leagueIsInProgress) {
        throw new ValidationError(
          "You cannot remove members while the league is in season",
        );
      }

      await this.leagueMembersMutationService.delete(
        leagueId,
        targetUserId,
        tx,
      );

      const leagueType = await this.leagueTypesQueryService.findById(
        league.leagueTypeId,
        tx,
      );
      if (!leagueType) {
        throw new NotFoundError("League type not found");
      }

      const season =
        await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
          leagueType.sportLeagueId,
          tx,
        );
      if (!season) {
        throw new NotFoundError("Season not found");
      }

      // because of the fact that we can't remove members when a league is in season, what this means
      // is that we'd only every delete standings before a season starts.
      await this.standingsMutationService.deleteByUserLeagueSeason(
        targetUserId,
        leagueId,
        season.id,
        tx,
      );
    });
  }

  async leaveLeague(userId: string, leagueId: string): Promise<void> {
    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found.");
    }
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      leagueId,
      userId,
    );
    if (!member) {
      throw new NotFoundError("Member not found in league.");
    }

    if (await this.leaguesUtilService.leagueSeasonInProgress(league)) {
      throw new ValidationError("Cannot leave a league that is in season.");
    }

    const allMembers =
      await this.leagueMembersQueryService.listByLeagueId(leagueId);
    if (allMembers.length === 1) {
      await this.leaguesMutationService.delete(leagueId);
      return;
    }

    if (member.role === LEAGUE_MEMBER_ROLES.COMMISSIONER) {
      const otherCommissioners = allMembers.filter(
        (m) =>
          m.role === LEAGUE_MEMBER_ROLES.COMMISSIONER && m.userId !== userId,
      );

      if (otherCommissioners.length === 0) {
        throw new ValidationError(
          "A commissioner cannot leave the league without another commissioner present.",
        );
      }
    }

    await this.leagueMembersMutationService.delete(leagueId, member.userId);
  }
}
