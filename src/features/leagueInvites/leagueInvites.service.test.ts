import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import {
  DBLeagueInvite,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  CreateLeagueInviteSchema,
} from "./leagueInvites.types";
import { DBLeague, LEAGUE_VISIBILITIES } from "../leagues/leagues.types";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types";
import { DBPhase } from "../phases/phases.types";
import { z } from "zod";
import { DBUser } from "../users/users.types";
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
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import { LeaguesUtilService } from "../leagues/leagues.util.service";

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
  let leaguesUtilService: MockProxy<LeaguesUtilService>;

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
    leaguesUtilService = mock<LeaguesUtilService>();

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
      leaguesUtilService,
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
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([]);

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
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(0);
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
      ).rejects.toThrow(new ValidationError("League is at capacity"));

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
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(true);
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
      ).rejects.toThrow(new ValidationError("League's season is in progress"));

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
      ] as DBLeagueMember[]);
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(1);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([
        mockInvite,
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
        [inviteId],
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

    it("should throw an error if the invite is not found", async () => {
      leagueInvitesQueryService.findById.mockResolvedValue(null);
      await expect(
        leagueInvitesService.respond(
          "user",
          "non-existent-invite",
          LEAGUE_INVITE_STATUSES.ACCEPTED,
        ),
      ).rejects.toThrow(new NotFoundError("Invite not found"));
    });

    it("should throw an error if the user is not the invitee", async () => {
      const mockInvite: DBLeagueInvite = {
        id: "invite-id",
        inviteeId: "correct-user",
        leagueId: "league-id",
        type: LEAGUE_INVITE_TYPES.DIRECT,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        inviterId: "inviter-id",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      await expect(
        leagueInvitesService.respond(
          "wrong-user",
          "invite-id",
          LEAGUE_INVITE_STATUSES.ACCEPTED,
        ),
      ).rejects.toThrow(new ForbiddenError("You are not the invitee"));
    });

    it("should throw an error if the invite has already been responded to", async () => {
      const mockInvite: DBLeagueInvite = {
        id: "invite-id",
        inviteeId: "user-id",
        status: LEAGUE_INVITE_STATUSES.ACCEPTED,
        leagueId: "league-id",
        type: LEAGUE_INVITE_TYPES.DIRECT,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        inviterId: "inviter-id",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      await expect(
        leagueInvitesService.respond(
          "user-id",
          "invite-id",
          LEAGUE_INVITE_STATUSES.ACCEPTED,
        ),
      ).rejects.toThrow(new ValidationError("Invite already responded to"));
    });

    it("should throw an error if the invite has expired", async () => {
      const mockInvite: DBLeagueInvite = {
        id: "invite-id",
        inviteeId: "user-id",
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        leagueId: "league-id",
        type: LEAGUE_INVITE_TYPES.DIRECT,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        inviterId: "inviter-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue({} as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(
        leagueInvitesService.respond(
          "user-id",
          "invite-id",
          LEAGUE_INVITE_STATUSES.ACCEPTED,
        ),
      ).rejects.toThrow(new ValidationError("Invite has expired"));
    });
  });

  describe("create", () => {
    const leagueId = "league-uuid";
    const userId = "user-uuid";

    it("should create a direct invite successfully", async () => {
      const inviteeId = "invitee-id";
      const mockLeague = { id: leagueId, size: 10 } as DBLeague;
      const mockMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId
        .mockResolvedValueOnce(mockMember) // For the creator of the invite
        .mockResolvedValueOnce(null); // For the invitee (not a member)
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      usersQueryService.findById.mockResolvedValue({ id: inviteeId } as DBUser);
      leagueInvitesQueryService.findByInviteeLeagueAndStatus.mockResolvedValue(
        null,
      );

      const inviteData = {
        leagueId,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviteeId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        expiresInDays: 7,
      };
      await leagueInvitesService.create(
        userId,
        inviteData as z.infer<typeof CreateLeagueInviteSchema>,
      );

      expect(leagueInvitesMutationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: LEAGUE_INVITE_TYPES.DIRECT,
          inviteeId,
        }),
        undefined,
      );
    });

    it("should create a link invite successfully", async () => {
      const mockLeague = { id: leagueId, size: 10 } as DBLeague;
      const mockMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);

      const inviteData = {
        leagueId,
        type: LEAGUE_INVITE_TYPES.LINK,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        expiresInDays: 7,
      };
      await leagueInvitesService.create(userId, inviteData);

      expect(leagueInvitesMutationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: LEAGUE_INVITE_TYPES.LINK,
          token: expect.any(String),
        }),
        undefined,
      );
    });

    it("should throw an error if the user is not a commissioner", async () => {
      const mockMember = { role: LEAGUE_MEMBER_ROLES.MEMBER } as DBLeagueMember;
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );

      const inviteData = { leagueId } as z.infer<
        typeof CreateLeagueInviteSchema
      >;
      await expect(
        leagueInvitesService.create(userId, inviteData),
      ).rejects.toThrow(new ForbiddenError("You are not a commissioner"));
    });

    it("should throw an error if league is at capacity", async () => {
      const mockLeague = { id: leagueId, size: 1 } as DBLeague;
      const mockMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(0);

      const inviteData = { leagueId } as z.infer<
        typeof CreateLeagueInviteSchema
      >;
      await expect(
        leagueInvitesService.create(userId, inviteData),
      ).rejects.toThrow(new ValidationError("League is at capacity"));
    });

    it("should throw an error if season is in progress", async () => {
      const mockLeague = { id: leagueId, size: 10 } as DBLeague;
      const mockMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(true);

      const inviteData = { leagueId } as z.infer<
        typeof CreateLeagueInviteSchema
      >;
      await expect(
        leagueInvitesService.create(userId, inviteData),
      ).rejects.toThrow(new ValidationError("League's season is in progress"));
    });

    it("should throw an error if invitee is already a member", async () => {
      const inviteeId = "invitee-id";
      const mockLeague = { id: leagueId, size: 10 } as DBLeague;
      const mockMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        mockMember,
      ); // for inviter
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      usersQueryService.findById.mockResolvedValue({ id: inviteeId } as DBUser);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce({
        userId: inviteeId,
      } as DBLeagueMember); // for invitee

      const inviteData = {
        leagueId,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviteeId,
      } as z.infer<typeof CreateLeagueInviteSchema>;
      await expect(
        leagueInvitesService.create(userId, inviteData),
      ).rejects.toThrow(
        new ConflictError("Invitee is already a member of this league."),
      );
    });

    it("should throw an error if invitee already has a pending invite", async () => {
      const inviteeId = "invitee-id";
      const mockLeague = { id: leagueId, size: 10 } as DBLeague;
      const mockMember = {
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      } as DBLeagueMember;
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        mockMember,
      );
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      usersQueryService.findById.mockResolvedValue({ id: inviteeId } as DBUser);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValueOnce(
        null,
      );
      leagueInvitesQueryService.findByInviteeLeagueAndStatus.mockResolvedValue({
        id: "existing-invite",
      } as DBLeagueInvite);

      const inviteData = {
        leagueId,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviteeId,
      } as z.infer<typeof CreateLeagueInviteSchema>;
      await expect(
        leagueInvitesService.create(userId, inviteData),
      ).rejects.toThrow(
        new ConflictError("User has already been invited to the league"),
      );
    });
  });

  describe("joinWithToken", () => {
    it("should allow a user to join with a valid token", async () => {
      const token = "valid-token";
      const userId = "user-uuid";
      const leagueId = "league-uuid";
      const mockInvite: DBLeagueInvite = {
        id: "invite-id",
        leagueId,
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        inviteeId: "invitee-id",
        type: LEAGUE_INVITE_TYPES.DIRECT,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        inviterId: "inviter-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockLeague: DBLeague = {
        id: leagueId,
        size: 10,
        name: "Test League",
        leagueTypeId: "lt-uuid",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        startPhaseTemplateId: "start-phase-uuid",
        endPhaseTemplateId: "end-phase-uuid",
      };

      leagueInvitesQueryService.findByToken.mockResolvedValue(mockInvite);
      leaguesQueryService.findById.mockResolvedValue(mockLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([]);

      await leagueInvitesService.joinWithToken(userId, token);

      expect(
        leagueMembersMutationService.createLeagueMember,
      ).toHaveBeenCalled();
    });

    it("should throw an error if the invite token is not found", async () => {
      leagueInvitesQueryService.findByToken.mockResolvedValue(null);

      await expect(
        leagueInvitesService.joinWithToken("user", "invalid-token"),
      ).rejects.toThrow(new NotFoundError("Invite not found"));
    });

    // all the other tests are in the respond test
  });
});
