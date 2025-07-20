import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { LeagueMembersService } from "./leagueMembers.service";
import { LeagueMembersQueryService } from "./leagueMembers.query.service";
import { ProfilesQueryService } from "../profiles/profiles.query.service";
import { LeaguesQueryService } from "../leagues/leagues.query.service";
import { LeagueMembersMutationService } from "./leagueMembers.mutation.service";
import { DBLeagueMember, LEAGUE_MEMBER_ROLES } from "./leagueMembers.types";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";

describe("LeagueMembersService", () => {
  let leagueMembersService: LeagueMembersService;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let profilesQueryService: MockProxy<ProfilesQueryService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;

  beforeEach(() => {
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    profilesQueryService = mock<ProfilesQueryService>();
    leaguesQueryService = mock<LeaguesQueryService>();
    leagueMembersMutationService = mock<LeagueMembersMutationService>();

    leagueMembersService = new LeagueMembersService(
      leagueMembersQueryService,
      profilesQueryService,
      leaguesQueryService,
      leagueMembersMutationService,
    );
  });

  describe("updateMemberRole", () => {
    it("should successfully update a member role", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      const targetUserMember = {} as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        actingUserMember,
      );
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        targetUserMember,
      );
      leagueMembersMutationService.update.mockResolvedValue(
        {} as DBLeagueMember,
      );

      const result = await leagueMembersService.update(
        "acting-user",
        "league-1",
        "target-user",
        { role: LEAGUE_MEMBER_ROLES.MEMBER },
      );

      expect(result).toBeDefined();
    });

    it("should throw a forbidden error if the acting user is not a commissioner", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      } as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        actingUserMember,
      );

      await expect(
        leagueMembersService.update("acting-user", "league-1", "target-user", {
          role: LEAGUE_MEMBER_ROLES.MEMBER,
        }),
      ).rejects.toThrow(
        new ForbiddenError(
          "You are not authorized to update members in this league",
        ),
      );
    });

    it("should throw a not found error if the target user is not a member", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        actingUserMember,
      );
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        null,
      );

      await expect(
        leagueMembersService.update("acting-user", "league-1", "target-user", {
          role: LEAGUE_MEMBER_ROLES.MEMBER,
        }),
      ).rejects.toThrow(
        new NotFoundError("Target user is not a member of this league"),
      );
    });

    it("should throw a validation error if a sole commissioner tries to demote themselves", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        actingUserMember,
      );
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        actingUserMember,
      ]);

      await expect(
        leagueMembersService.update("acting-user", "league-1", "acting-user", {
          role: LEAGUE_MEMBER_ROLES.MEMBER,
        }),
      ).rejects.toThrow(
        new ValidationError(
          "You cannot change your own role to member if you are the sole commissioner",
        ),
      );
    });
  });
});
