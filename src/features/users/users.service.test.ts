import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { UsersService } from "./users.service";
import { UsersMutationService } from "./users.mutation.service";
import { LeaguesMutationService } from "../leagues/leagues.mutation.service";
import { LeaguesQueryService } from "../leagues/leagues.query.service";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service";
import { ProfilesMutationService } from "../profiles/profiles.mutation.service";
import { ValidationError } from "../../lib/errors";
import {
  LEAGUE_MEMBER_ROLES,
  DBLeagueMember,
} from "../leagueMembers/leagueMembers.types";
import {
  ANONYMOUS_LAST_NAME,
  ANONYMOUS_FIRST_NAME,
  ANONYMOUS_USERNAME,
} from "../profiles/profiles.types";
import { DBLeague, LEAGUE_VISIBILITIES } from "../leagues/leagues.types";
import { AccountsMutationService } from "../accounts/accounts.mutation.service";
import { SessionsMutationService } from "../sessions/sessions.mutation.service";
import { VerificationsMutationService } from "../verifications/verifications.mutation.service";
import { UsersQueryService } from "./users.query.service";
import { DBUser } from "./users.types";
import { NotFoundError } from "../../lib/errors";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("UsersService", () => {
  let usersService: UsersService;
  let usersMutationService: MockProxy<UsersMutationService>;
  let leaguesMutationService: MockProxy<LeaguesMutationService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;
  let profilesMutationService: MockProxy<ProfilesMutationService>;
  let accountsMutationService: MockProxy<AccountsMutationService>;
  let sessionsMutationService: MockProxy<SessionsMutationService>;
  let verificationsMutationService: MockProxy<VerificationsMutationService>;
  let usersQueryService: MockProxy<UsersQueryService>;
  let user: DBUser;

  beforeEach(() => {
    usersMutationService = mock<UsersMutationService>();
    leaguesMutationService = mock<LeaguesMutationService>();
    leaguesQueryService = mock<LeaguesQueryService>();
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    leagueMembersMutationService = mock<LeagueMembersMutationService>();
    profilesMutationService = mock<ProfilesMutationService>();
    accountsMutationService = mock<AccountsMutationService>();
    sessionsMutationService = mock<SessionsMutationService>();
    verificationsMutationService = mock<VerificationsMutationService>();
    usersQueryService = mock<UsersQueryService>();

    user = {
      id: "user-1",
      email: "test@test.com",
      name: "test",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersService = new UsersService(
      usersMutationService,
      usersQueryService,
      leaguesMutationService,
      leaguesQueryService,
      leagueMembersQueryService,
      leagueMembersMutationService,
      profilesMutationService,
      accountsMutationService,
      sessionsMutationService,
      verificationsMutationService,
    );
  });

  it("should throw a not found error if the user does not exist", async () => {
    const userId = "user-1";
    usersQueryService.findById.mockResolvedValue(undefined);

    await expect(usersService.anonymizeAccount(userId)).rejects.toThrow(
      new NotFoundError("User not found"),
    );
  });

  it("should anonymize a user with no leagues", async () => {
    const userId = "user-1";
    leaguesQueryService.listByUserId.mockResolvedValue([]);
    usersQueryService.findById.mockResolvedValue(user);

    await usersService.anonymizeAccount(userId);

    expect(usersQueryService.findById).toHaveBeenCalledWith(userId, undefined);
    expect(leaguesQueryService.listByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(leagueMembersMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(accountsMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(sessionsMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(
      verificationsMutationService.deleteByIdentifier,
    ).toHaveBeenCalledWith(user.email, undefined);
    expect(usersMutationService.update).toHaveBeenCalledWith(
      userId,
      {
        name: "anonymous",
        email: "anonymous",
        emailVerified: false,
        image: null,
      },
      undefined,
    );
    expect(profilesMutationService.update).toHaveBeenCalledWith(
      userId,
      {
        username: ANONYMOUS_USERNAME,
        firstName: ANONYMOUS_FIRST_NAME,
        lastName: ANONYMOUS_LAST_NAME,
        avatarUrl: null,
      },
      undefined,
    );
  });

  it("should delete leagues where the user is the sole member", async () => {
    const userId = "user-1";
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
    const member: DBLeagueMember = {
      leagueId: "league-1",
      userId,
      role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersQueryService.findById.mockResolvedValue(user);
    leaguesQueryService.listByUserId.mockResolvedValue([league]);
    leagueMembersQueryService.listByLeagueId.mockResolvedValue([member]);

    await usersService.anonymizeAccount(userId);

    expect(leaguesQueryService.listByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(leagueMembersQueryService.listByLeagueId).toHaveBeenCalledWith(
      league.id,
      undefined,
    );
    expect(leaguesMutationService.delete).toHaveBeenCalledWith(
      league.id,
      undefined,
    );
    expect(leagueMembersMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(accountsMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(sessionsMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(
      verificationsMutationService.deleteByIdentifier,
    ).toHaveBeenCalledWith(user.email, undefined);
    expect(usersMutationService.update).toHaveBeenCalled();
    expect(profilesMutationService.update).toHaveBeenCalled();
  });

  it("should throw a validation error if the user is the sole commissioner of a league", async () => {
    const userId = "user-1";
    const otherUserId = "user-2";
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
    const userMember: DBLeagueMember = {
      leagueId: "league-1",
      userId,
      role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const otherMember: DBLeagueMember = {
      leagueId: "league-1",
      userId: otherUserId,
      role: LEAGUE_MEMBER_ROLES.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersQueryService.findById.mockResolvedValue(user);
    leaguesQueryService.listByUserId.mockResolvedValue([league]);
    leagueMembersQueryService.listByLeagueId.mockResolvedValue([
      userMember,
      otherMember,
    ]);

    await expect(usersService.anonymizeAccount(userId)).rejects.toThrow(
      new ValidationError(
        "You must designate another commissioner before deleting your account.",
      ),
    );

    expect(leaguesMutationService.delete).not.toHaveBeenCalled();
    expect(usersMutationService.update).not.toHaveBeenCalled();
    expect(profilesMutationService.update).not.toHaveBeenCalled();
  });

  it("should succeed if the user is a commissioner but not the sole one", async () => {
    const userId = "user-1";
    const otherCommissionerId = "user-2";
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
    const userMember: DBLeagueMember = {
      leagueId: "league-1",
      userId,
      role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const otherCommissioner: DBLeagueMember = {
      leagueId: "league-1",
      userId: otherCommissionerId,
      role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersQueryService.findById.mockResolvedValue(user);
    leaguesQueryService.listByUserId.mockResolvedValue([league]);
    leagueMembersQueryService.listByLeagueId.mockResolvedValue([
      userMember,
      otherCommissioner,
    ]);

    await usersService.anonymizeAccount(userId);

    expect(leaguesMutationService.delete).not.toHaveBeenCalled();
    expect(leagueMembersMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(accountsMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(sessionsMutationService.deleteByUserId).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(
      verificationsMutationService.deleteByIdentifier,
    ).toHaveBeenCalledWith(user.email, undefined);
    expect(usersMutationService.update).toHaveBeenCalled();
    expect(profilesMutationService.update).toHaveBeenCalled();
  });
});
