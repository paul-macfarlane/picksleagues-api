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
import { TYPES } from "../../lib/inversify.types";

@injectable()
export class LeagueMembersService {
  constructor(
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
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

  async listByLeagueId(
    leagueId: string,
    query: z.infer<typeof LeagueMemberIncludeSchema>,
  ): Promise<PopulatedDBLeagueMember[]> {
    const members =
      await this.leagueMembersQueryService.listByLeagueId(leagueId);

    return this.populateMembers(members, query);
  }
}
