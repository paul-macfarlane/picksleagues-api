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
import { LeaguesUtilService } from "../leagues/leagues.util.service";
import { DBLeague, LEAGUE_VISIBILITIES } from "../leagues/leagues.types";
import { LeaguesMutationService } from "../leagues/leagues.mutation.service";

describe("LeagueMembersService", () => {
  let leagueMembersService: LeagueMembersService;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let profilesQueryService: MockProxy<ProfilesQueryService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;
  let leaguesUtilService: MockProxy<LeaguesUtilService>;
  let leaguesMutationService: MockProxy<LeaguesMutationService>;

  beforeEach(() => {
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    profilesQueryService = mock<ProfilesQueryService>();
    leaguesQueryService = mock<LeaguesQueryService>();
    leagueMembersMutationService = mock<LeagueMembersMutationService>();
    leaguesUtilService = mock<LeaguesUtilService>();
    leaguesMutationService = mock<LeaguesMutationService>();

    leagueMembersService = new LeagueMembersService(
      leagueMembersQueryService,
      leagueMembersMutationService,
      leaguesUtilService,
      leaguesQueryService,
      leaguesMutationService,
      profilesQueryService,
    );
  });

  describe("update", () => {
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
        userId: "acting-user",
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

  describe("removeMember", () => {
    it("should successfully remove a member", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      const targetUserMember = {} as DBLeagueMember;
      const league: DBLeague = {
        id: "league-1",
        name: "Test League",
        image: null,
        leagueTypeId: "type-1",
        startPhaseTemplateId: "phase-1",
        endPhaseTemplateId: "phase-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 1,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        actingUserMember,
      );
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        targetUserMember,
      );
      leaguesQueryService.findById.mockResolvedValue(league);
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersMutationService.delete.mockResolvedValue();

      await leagueMembersService.removeMember(
        "acting-user",
        "league-1",
        "target-user",
      );

      expect(leagueMembersMutationService.delete).toHaveBeenCalledWith(
        "league-1",
        "target-user",
      );
    });

    it("should throw a forbidden error if the acting user is not a commissioner", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      } as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        actingUserMember,
      );

      await expect(
        leagueMembersService.removeMember(
          "acting-user",
          "league-1",
          "target-user",
        ),
      ).rejects.toThrow(
        new ForbiddenError(
          "You are not authorized to remove members from this league",
        ),
      );
    });

    it("should throw a validation error if a commissioner tries to remove themselves", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        actingUserMember,
      );

      await expect(
        leagueMembersService.removeMember(
          "acting-user",
          "league-1",
          "acting-user",
        ),
      ).rejects.toThrow(
        new ValidationError("You cannot remove yourself from the league"),
      );
    });

    it("should throw a validation error if the league is in season", async () => {
      const actingUserMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      const targetUserMember = {} as DBLeagueMember;
      const league: DBLeague = {
        id: "league-1",
        name: "Test League",
        image: null,
        leagueTypeId: "type-1",
        startPhaseTemplateId: "phase-1",
        endPhaseTemplateId: "phase-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 1,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        actingUserMember,
      );
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        targetUserMember,
      );
      leaguesQueryService.findById.mockResolvedValue(league);
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(true);

      await expect(
        leagueMembersService.removeMember(
          "acting-user",
          "league-1",
          "target-user",
        ),
      ).rejects.toThrow(
        new ValidationError(
          "You cannot remove members while the league is in season",
        ),
      );
    });
  });

  describe("leaveLeague", () => {
    const leagueId = "league-1";
    const userId = "user-1";
    const mockLeague: DBLeague = {
      id: leagueId,
      name: "Test League",
      image: null,
      leagueTypeId: "type-1",
      startPhaseTemplateId: "phase-1",
      endPhaseTemplateId: "phase-2",
      visibility: LEAGUE_VISIBILITIES.PRIVATE,
      size: 10,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should allow a member to leave a league", async () => {
      const mockMember = {
        userId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        mockMember,
        { userId: "user-2" } as DBLeagueMember,
      ]);

      await leagueMembersService.leaveLeague(userId, leagueId);

      expect(leagueMembersMutationService.delete).toHaveBeenCalledWith(
        leagueId,
        userId,
      );
    });

    it("should throw an error if league is in season", async () => {
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        {} as DBLeagueMember,
      );
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(true);

      await expect(
        leagueMembersService.leaveLeague(userId, leagueId),
      ).rejects.toThrow(
        new ValidationError("Cannot leave a league that is in season."),
      );
    });

    it("should delete the league if the last member leaves", async () => {
      const mockMember = {
        userId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([mockMember]);

      await leagueMembersService.leaveLeague(userId, leagueId);

      expect(leaguesMutationService.delete).toHaveBeenCalledWith(leagueId);
      expect(leagueMembersMutationService.delete).not.toHaveBeenCalled();
    });

    it("should throw an error if a sole commissioner tries to leave", async () => {
      const mockMember = {
        userId,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        mockMember,
        {
          userId: "user-2",
          role: LEAGUE_MEMBER_ROLES.MEMBER,
        } as DBLeagueMember,
      ]);

      await expect(
        leagueMembersService.leaveLeague(userId, leagueId),
      ).rejects.toThrow(
        new ValidationError(
          "A commissioner cannot leave the league without another commissioner present.",
        ),
      );
    });

    it("should allow a commissioner to leave if another commissioner exists", async () => {
      const mockMember = {
        userId,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      const otherCommissioner = {
        userId: "user-2",
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        mockMember,
        otherCommissioner,
      ]);

      await leagueMembersService.leaveLeague(userId, leagueId);

      expect(leagueMembersMutationService.delete).toHaveBeenCalledWith(
        leagueId,
        userId,
      );
    });

    it("should throw an error if the league is not found", async () => {
      leaguesQueryService.findById.mockResolvedValue(null);
      await expect(
        leagueMembersService.leaveLeague(userId, leagueId),
      ).rejects.toThrow(new NotFoundError("League not found."));
    });

    it("should throw an error if the user is not a member of the league", async () => {
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);
      await expect(
        leagueMembersService.leaveLeague(userId, leagueId),
      ).rejects.toThrow(new NotFoundError("Member not found in league."));
    });
  });
});
