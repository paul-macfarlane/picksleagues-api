import { injectable, inject } from "inversify";
import { z } from "zod";
import {
  DBLeagueMember,
  DBLeagueMemberWithProfile,
  LeagueMemberIncludeSchema,
  PopulatedDBLeagueMember,
} from "./leagueMembers.types";
import { LeagueMembersQueryService } from "./leagueMembers.query.service";
import { ProfilesQueryService } from "../profiles/profiles.query.service";
import { LeaguesQueryService } from "../leagues/leagues.query.service";
import { TYPES } from "../../lib/inversify.types";
import { NotFoundError } from "../../lib/errors";

@injectable()
export class LeagueMembersService {
  constructor(
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
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
}
