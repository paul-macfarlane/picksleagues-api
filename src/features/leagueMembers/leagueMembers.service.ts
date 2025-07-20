import { injectable, inject } from "inversify";
import { z } from "zod";
import {
  DBLeagueMember,
  DBLeagueMemberWithProfile,
  LeagueMemberIncludeSchema,
  PopulatedDBLeagueMember,
  LEAGUE_MEMBER_ROLES,
  UpdateLeagueMemberSchema,
} from "./leagueMembers.types";
import { LeagueMembersQueryService } from "./leagueMembers.query.service";
import { ProfilesQueryService } from "../profiles/profiles.query.service";
import { LeaguesQueryService } from "../leagues/leagues.query.service";
import { TYPES } from "../../lib/inversify.types";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../lib/errors";
import { LeagueMembersMutationService } from "./leagueMembers.mutation.service";

@injectable()
export class LeagueMembersService {
  constructor(
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueMembersMutationService)
    private leagueMembersMutationService: LeagueMembersMutationService,
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
}
