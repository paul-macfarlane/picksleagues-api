import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import {
  DBLeagueInvite,
  LEAGUE_INVITE_STATUSES,
  LEAGUE_INVITE_TYPES,
  CreateLeagueInviteSchema,
} from "./leagueInvites.types.js";
import { DBLeague, LEAGUE_VISIBILITIES } from "../leagues/leagues.types.js";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types.js";
import { DBPhase } from "../phases/phases.types.js";
import { z } from "zod";
import { DBUser } from "../users/users.types.js";
import { DBLeagueType } from "../leagueTypes/leagueTypes.types.js";
import { DBSeason } from "../seasons/seasons.types.js";
import { LeagueInvitesService } from "./leagueInvites.service.js";
import { LeagueInvitesQueryService } from "./leagueInvites.query.service.js";
import { LeagueInvitesMutationService } from "./leagueInvites.mutation.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { LeagueMembersUtilService } from "../leagueMembers/leagueMembers.util.service.js";
import { UsersQueryService } from "../users/users.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
import { LeaguesUtilService } from "../leagues/leagues.util.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { StandingsMutationService } from "../standings/standings.mutation.service.js";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("LeagueInvitesService", () => {
  let leagueInvitesQueryService: MockProxy<LeagueInvitesQueryService>;
  let leagueInvitesMutationService: MockProxy<LeagueInvitesMutationService>;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let leagueMembersUtilService: MockProxy<LeagueMembersUtilService>;
  let usersQueryService: MockProxy<UsersQueryService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let profilesQueryService: MockProxy<ProfilesQueryService>;
  let phasesQueryService: MockProxy<PhasesQueryService>;
  let leaguesUtilService: MockProxy<LeaguesUtilService>;
  let seasonsUtilService: MockProxy<SeasonsUtilService>;
  let standingsMutationService: MockProxy<StandingsMutationService>;

  let leagueInvitesService: LeagueInvitesService;

  beforeEach(() => {
    leagueInvitesQueryService = mock<LeagueInvitesQueryService>();
    leagueInvitesMutationService = mock<LeagueInvitesMutationService>();
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    leagueMembersUtilService = mock<LeagueMembersUtilService>();
    usersQueryService = mock<UsersQueryService>();
    leaguesQueryService = mock<LeaguesQueryService>();
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    profilesQueryService = mock<ProfilesQueryService>();
    phasesQueryService = mock<PhasesQueryService>();
    leaguesUtilService = mock<LeaguesUtilService>();
    seasonsUtilService = mock<SeasonsUtilService>();
    standingsMutationService = mock<StandingsMutationService>();

    leagueInvitesService = new LeagueInvitesService(
      leagueInvitesQueryService,
      leagueInvitesMutationService,
      leagueMembersQueryService,
      usersQueryService,
      leaguesQueryService,
      leagueTypesQueryService,
      profilesQueryService,
      leaguesUtilService,
      leagueMembersUtilService,
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
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);
      leagueInvitesMutationService.deleteByIds.mockResolvedValue();
      leaguesUtilService.getLeagueCapacity
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(10);
      leaguesUtilService.leagueSeasonInProgress
        .calledWith(mockLeague, undefined)
        .mockResolvedValue(false);
      leagueInvitesQueryService.listActiveByLeagueId.mockResolvedValue([]);
      leagueTypesQueryService.findById.mockResolvedValue({
        id: "lt-uuid",
        sportLeagueId: "sport-1",
      } as DBLeagueType);
      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: "season-1",
        } as DBSeason,
      );
      standingsMutationService.create.mockResolvedValue();

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.ACCEPTED,
      );

      // Assert
      expect(
        leagueMembersUtilService.addMemberAndInitializeStandings,
      ).toHaveBeenCalledWith(
        leagueId,
        userId,
        LEAGUE_MEMBER_ROLES.MEMBER,
        undefined,
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
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);
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
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);
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
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);
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
      leagueInvitesMutationService.deleteByIds.mockResolvedValue();
      leagueTypesQueryService.findById.mockResolvedValue({
        id: "lt-uuid",
        sportLeagueId: "sport-1",
      } as DBLeagueType);
      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: "season-1",
        } as DBSeason,
      );
      standingsMutationService.create.mockResolvedValue();

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.ACCEPTED,
      );

      // Assert
      expect(
        leagueMembersUtilService.addMemberAndInitializeStandings,
      ).toHaveBeenCalled();
      expect(leagueInvitesMutationService.deleteByIds).toHaveBeenCalledWith(
        [inviteId], // This is the only pending invite in the test setup
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
        leagueMembersUtilService.addMemberAndInitializeStandings,
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
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);

      // Act
      await leagueInvitesService.respond(
        userId,
        inviteId,
        LEAGUE_INVITE_STATUSES.DECLINED,
      );

      // Assert
      expect(
        leagueMembersUtilService.addMemberAndInitializeStandings,
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
      leagueTypesQueryService.findById.mockResolvedValue({
        id: "lt-uuid",
        sportLeagueId: "sport-1",
      } as DBLeagueType);
      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: "season-1",
        } as DBSeason,
      );
      standingsMutationService.create.mockResolvedValue();

      await leagueInvitesService.joinWithToken(userId, token);

      expect(
        leagueMembersUtilService.addMemberAndInitializeStandings,
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

  describe("revoke", () => {
    const userId = "user-uuid";
    const inviteId = "invite-uuid";
    const leagueId = "league-uuid";

    it("should successfully revoke an invite when user is a commissioner", async () => {
      // Arrange
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: "invitee-uuid",
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockMember: DBLeagueMember = {
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leagueInvitesMutationService.delete.mockResolvedValue();

      // Act
      await leagueInvitesService.revoke(userId, inviteId);

      // Assert
      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).toHaveBeenCalledWith(leagueId, userId, undefined);
      expect(leagueInvitesMutationService.delete).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
    });

    it("should throw NotFoundError when invite is not found", async () => {
      // Arrange
      leagueInvitesQueryService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        leagueInvitesService.revoke(userId, inviteId),
      ).rejects.toThrow(new NotFoundError("Invite not found"));

      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).not.toHaveBeenCalled();
      expect(leagueInvitesMutationService.delete).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when user is not a member of the league", async () => {
      // Arrange
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: "invitee-uuid",
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
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        leagueInvitesService.revoke(userId, inviteId),
      ).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );

      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).toHaveBeenCalledWith(leagueId, userId, undefined);
      expect(leagueInvitesMutationService.delete).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when user is not a commissioner", async () => {
      // Arrange
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: "invitee-uuid",
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockMember: DBLeagueMember = {
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER, // Not a commissioner
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );

      // Act & Assert
      await expect(
        leagueInvitesService.revoke(userId, inviteId),
      ).rejects.toThrow(
        new ForbiddenError("You are not a commissioner of this league"),
      );

      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).toHaveBeenCalledWith(leagueId, userId, undefined);
      expect(leagueInvitesMutationService.delete).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when user is a member but not a commissioner", async () => {
      // Arrange
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: "invitee-uuid",
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockMember: DBLeagueMember = {
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER, // Member but not commissioner
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );

      // Act & Assert
      await expect(
        leagueInvitesService.revoke(userId, inviteId),
      ).rejects.toThrow(
        new ForbiddenError("You are not a commissioner of this league"),
      );

      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).toHaveBeenCalledWith(leagueId, userId, undefined);
      expect(leagueInvitesMutationService.delete).not.toHaveBeenCalled();
    });

    it("should work with different invite types", async () => {
      // Arrange
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: "invitee-uuid",
        status: LEAGUE_INVITE_STATUSES.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.LINK, // Link invite type
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "link-token",
      };
      const mockMember: DBLeagueMember = {
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leagueInvitesMutationService.delete.mockResolvedValue();

      // Act
      await leagueInvitesService.revoke(userId, inviteId);

      // Assert
      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).toHaveBeenCalledWith(leagueId, userId, undefined);
      expect(leagueInvitesMutationService.delete).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
    });

    it("should work with different invite statuses", async () => {
      // Arrange
      const mockInvite: DBLeagueInvite = {
        id: inviteId,
        leagueId,
        inviteeId: "invitee-uuid",
        status: LEAGUE_INVITE_STATUSES.ACCEPTED, // Already accepted invite
        expiresAt: new Date(Date.now() + 86400000),
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        type: LEAGUE_INVITE_TYPES.DIRECT,
        inviterId: "inviter-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
        token: null,
      };
      const mockMember: DBLeagueMember = {
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leagueInvitesQueryService.findById.mockResolvedValue(mockInvite);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember,
      );
      leagueInvitesMutationService.delete.mockResolvedValue();

      // Act
      await leagueInvitesService.revoke(userId, inviteId);

      // Assert
      expect(leagueInvitesQueryService.findById).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
      expect(
        leagueMembersQueryService.findByLeagueAndUserId,
      ).toHaveBeenCalledWith(leagueId, userId, undefined);
      expect(leagueInvitesMutationService.delete).toHaveBeenCalledWith(
        inviteId,
        undefined,
      );
    });
  });
});
