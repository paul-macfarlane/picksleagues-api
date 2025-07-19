import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types";
import { LeagueInvitesService } from "./leagueInvites.service";
import { LeagueInvitesQueryService } from "./leagueInvites.query.service";
import { LeagueInvitesMutationService } from "./leagueInvites.mutation.service";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service";
import { UsersQueryService } from "../users/users.query.service";
import { LeaguesQueryService } from "../leagues/leagues.query.service";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service";
import { ProfilesQueryService } from "../profiles/profiles.query.service";
import { PhasesQueryService } from "../phases/phases.query.service";
import {
  DBLeagueInvite,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
} from "./leagueInvites.types";
import { DBLeague, LEAGUE_VISIBILITIES } from "../leagues/leagues.types";
import { DBLeagueMember } from "../leagueMembers/leagueMembers.types";
import { DBPhase } from "../phases/phases.types";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("LeagueInvitesService", () => {
  let leagueInvitesQueryService: MockProxy<LeagueInvitesQueryService>;
  let leagueInvitesMutationService: MockProxy<LeagueInvitesMutationService>;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;
  let usersQueryService: MockProxy<UsersQueryService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let profilesQueryService: MockProxy<ProfilesQueryService>;
  let phasesQueryService: MockProxy<PhasesQueryService>;

  let leagueInvitesService: LeagueInvitesService;

  beforeEach(() => {
    leagueInvitesQueryService = mock<LeagueInvitesQueryService>();
    leagueInvitesMutationService = mock<LeagueInvitesMutationService>();
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    leagueMembersMutationService = mock<LeagueMembersMutationService>();
    usersQueryService = mock<UsersQueryService>();
    leaguesQueryService = mock<LeaguesQueryService>();
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    profilesQueryService = mock<ProfilesQueryService>();
    phasesQueryService = mock<PhasesQueryService>();

    leagueInvitesService = new LeagueInvitesService(
      leagueInvitesQueryService,
      leagueInvitesMutationService,
      leagueMembersQueryService,
      leagueMembersMutationService,
      usersQueryService,
      leaguesQueryService,
      leagueTypesQueryService,
      profilesQueryService,
      phasesQueryService,
    );
  });

  describe("respond", () => {
    // Basic test case - happy path
    it("should allow a user to accept an invite to a league with capacity and not in season", async () => {
      // Arrange
      const inviteId = "invite-uuid";
      const leagueId = "league-uuid";
      const userId = "user-uuid";
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: userId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockLeague: DBLeague = {
        id: leagueId,
        size: 10,
        startPhaseTemplateId: "start-phase-uuid",
        endPhaseTemplateId: "end-phase-uuid",
        name: "Test League",
        leagueTypeId: "lt-uuid",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([]);
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);
      leagueInvitesMutationService.deleteByIds.mockResolvedValue();

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.ACCEPTED,
      );

      // Assert
      expect(
        leagueMembersMutationService.createLeagueMember,
      ).toHaveBeenCalledWith(
        {
          leagueId,
          userId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
        },
        undefined, // expecting transaction to be undefined in mock
      );
      expect(leagueInvitesMutationService.update).toHaveBeenCalledWith(
        inviteId,
        { status: LEAGUE_INVITE_STATUSES.ACCEPTED },
        undefined,
      );
    });

    it("should throw an error and cleanup invites if the league is at capacity", async () => {
      // Arrange
      const inviteId = "invite-uuid";
      const leagueId = "league-uuid";
      const userId = "user-uuid";
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: userId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockLeague: DBLeague = {
        id: leagueId,
        size: 2,
        startPhaseTemplateId: "start-phase-uuid",
        endPhaseTemplateId: "end-phase-uuid",
        name: "Test League",
        leagueTypeId: "lt-uuid",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: "user1",
          leagueId: leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: "user2",
          leagueId: leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as DBLeagueMember[]);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([
        mockInvite,
      ]);

      // Act & Assert
      await expect(
        leagueInvitesService.respond(
          userId,
          inviteId,
          LEAGUE_INVITE_STATUSES.ACCEPTED,
        ),
      ).rejects.toThrow("League is at capacity");

      expect(leagueInvitesMutationService.deleteByIds).toHaveBeenCalledWith(
        [inviteId],
        undefined,
      );
    });

    it("should throw an error and cleanup invites if the season is in progress", async () => {
      // Arrange
      const inviteId = "invite-uuid";
      const leagueId = "league-uuid";
      const userId = "user-uuid";
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: userId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockLeague: DBLeague = {
        id: leagueId,
        size: 10,
        startPhaseTemplateId: "start-phase-uuid",
        endPhaseTemplateId: "end-phase-uuid",
        name: "Test League",
        leagueTypeId: "lt-uuid",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([]);
      phasesQueryService.findCurrentPhases.mockResolvedValue([
        {
          id: "phase1",
          seasonId: "season-uuid",
          phaseTemplateId: "pt-uuid",
          sequence: 1,
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as DBPhase[]);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([
        mockInvite,
      ]);

      // Act & Assert
      await expect(
        leagueInvitesService.respond(
          userId,
          inviteId,
          LEAGUE_INVITE_STATUSES.ACCEPTED,
        ),
      ).rejects.toThrow("League's season is in progress");

      expect(leagueInvitesMutationService.deleteByIds).toHaveBeenCalledWith(
        [inviteId],
        undefined,
      );
    });

    it("should cleanup invites when the last spot is filled", async () => {
      // Arrange
      const inviteId = "invite-uuid";
      const leagueId = "league-uuid";
      const userId = "user-uuid";
      const otherInviteId = "other-invite-uuid";
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: userId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockOtherInvite: DBLeagueInvite = {
        ...mockInvite,
        id: otherInviteId,
      };
      const mockLeague: DBLeague = {
        id: leagueId,
        size: 2,
        startPhaseTemplateId: "start-phase-uuid",
        endPhaseTemplateId: "end-phase-uuid",
        name: "Test League",
        leagueTypeId: "lt-uuid",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: "user1",
          leagueId: leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as DBLeagueMember[]);
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([
        mockInvite,
        mockOtherInvite,
      ]);

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.ACCEPTED,
      );

      // Assert
      expect(
        leagueMembersMutationService.createLeagueMember,
      ).toHaveBeenCalled();
      expect(leagueInvitesMutationService.deleteByIds).toHaveBeenCalledWith(
        [inviteId, otherInviteId],
        undefined,
      );
    });

    it("should silently succeed if the user is already a member", async () => {
      // Arrange
      const inviteId = "invite-uuid";
      const leagueId = "league-uuid";
      const userId = "user-uuid";
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: userId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
        userId: "user-uuid",
        leagueId: "league-uuid",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DBLeagueMember);

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.ACCEPTED,
      );

      // Assert
      expect(
        leagueMembersMutationService.createLeagueMember,
      ).not.toHaveBeenCalled();
      expect(leagueInvitesMutationService.update).not.toHaveBeenCalled();
    });

    it("should not create a member or cleanup invites if the user declines", async () => {
      // Arrange
      const inviteId = "invite-uuid";
      const leagueId = "league-uuid";
      const userId = "user-uuid";
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: userId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockLeague: DBLeague = {
        id: leagueId,
        size: 10,
        startPhaseTemplateId: "start-phase-uuid",
        endPhaseTemplateId: "end-phase-uuid",
        name: "Test League",
        leagueTypeId: "lt-uuid",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([]);
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.DECLINED,
      );

      // Assert
      expect(
        leagueMembersMutationService.createLeagueMember,
      ).not.toHaveBeenCalled();
      expect(leagueInvitesMutationService.deleteByIds).not.toHaveBeenCalled();
      expect(leagueInvitesMutationService.update).toHaveBeenCalledWith(
        inviteId,
        { status: LEAGUE_INVITE_STATUSES.DECLINED },
        undefined,
      );
    });
  });
});
