import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { LeaguesService } from "./leagues.service";
import { LeaguesQueryService } from "./leagues.query.service";
import { LeaguesMutationService } from "./leagues.mutation.service";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service";
import { LeagueInvitesQueryService } from "../leagueInvites/leagueInvites.query.service";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service";
import {
  DBLeague,
  LEAGUE_INCLUDES,
  LEAGUE_VISIBILITIES,
} from "./leagues.types";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types";
import {
  DBLeagueType,
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../leagueTypes/leagueTypes.types";

describe("LeaguesService", () => {
  let leaguesService: LeaguesService;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leaguesMutationService: MockProxy<LeaguesMutationService>;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;
  let leagueInvitesQueryService: MockProxy<LeagueInvitesQueryService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let phaseTemplatesQueryService: MockProxy<PhaseTemplatesQueryService>;

  beforeEach(() => {
    leaguesQueryService = mock<LeaguesQueryService>();
    leaguesMutationService = mock<LeaguesMutationService>();
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    leagueMembersMutationService = mock<LeagueMembersMutationService>();
    leagueInvitesQueryService = mock<LeagueInvitesQueryService>();
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    phaseTemplatesQueryService = mock<PhaseTemplatesQueryService>();

    leaguesService = new LeaguesService(
      leaguesQueryService,
      leaguesMutationService,
      leagueMembersQueryService,
      leagueMembersMutationService,
      leagueInvitesQueryService,
      leagueTypesQueryService,
      phaseTemplatesQueryService,
    );
  });

  describe("listLeaguesForUser", () => {
    it("should return leagues for a user without includes", async () => {
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
      leaguesQueryService.listByUserId.mockResolvedValue([league]);

      const result = await leaguesService.listLeaguesForUser(userId, {});

      expect(leaguesQueryService.listByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([league]);
    });

    it("should return leagues with members when requested", async () => {
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
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leaguesQueryService.listByUserId.mockResolvedValue([league]);
      leagueMembersQueryService.listByLeagueIds.mockResolvedValue([member]);

      const result = await leaguesService.listLeaguesForUser(userId, {
        include: [LEAGUE_INCLUDES.MEMBERS],
      });

      expect(leaguesQueryService.listByUserId).toHaveBeenCalledWith(userId);
      expect(leagueMembersQueryService.listByLeagueIds).toHaveBeenCalledWith(
        ["league-1"],
        undefined,
      );
      expect(result[0].members).toEqual([member]);
    });

    it("should return leagues with league type when requested", async () => {
      const userId = "user-1";
      const leagueTypeId = "type-1";
      const league: DBLeague = {
        id: "league-1",
        name: "Test League",
        image: null,
        leagueTypeId: leagueTypeId,
        startPhaseTemplateId: "phase-1",
        endPhaseTemplateId: "phase-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 1,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const leagueType: DBLeagueType = {
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: "test",
        sportLeagueId: "sport-league-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leaguesQueryService.listByUserId.mockResolvedValue([league]);
      leagueTypesQueryService.findById.mockResolvedValue(leagueType);

      const result = await leaguesService.listLeaguesForUser(userId, {
        include: [LEAGUE_INCLUDES.LEAGUE_TYPE],
      });

      expect(leaguesQueryService.listByUserId).toHaveBeenCalledWith(userId);
      expect(leagueTypesQueryService.findById).toHaveBeenCalledWith(
        leagueTypeId,
        undefined,
      );
      expect(result[0].leagueType).toEqual(leagueType);
    });

    it("should return leagues with members and league type when requested", async () => {
      const userId = "user-1";
      const leagueTypeId = "type-1";
      const league: DBLeague = {
        id: "league-1",
        name: "Test League",
        image: null,
        leagueTypeId: leagueTypeId,
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
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const leagueType: DBLeagueType = {
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: "test",
        sportLeagueId: "sport-league-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leaguesQueryService.listByUserId.mockResolvedValue([league]);
      leagueMembersQueryService.listByLeagueIds.mockResolvedValue([member]);
      leagueTypesQueryService.findById.mockResolvedValue(leagueType);

      const result = await leaguesService.listLeaguesForUser(userId, {
        include: [LEAGUE_INCLUDES.MEMBERS, LEAGUE_INCLUDES.LEAGUE_TYPE],
      });

      expect(leaguesQueryService.listByUserId).toHaveBeenCalledWith(userId);
      expect(leagueMembersQueryService.listByLeagueIds).toHaveBeenCalledWith(
        ["league-1"],
        undefined,
      );
      expect(leagueTypesQueryService.findById).toHaveBeenCalledWith(
        leagueTypeId,
        undefined,
      );
      expect(result[0].members).toEqual([member]);
      expect(result[0].leagueType).toEqual(leagueType);
    });
  });
});
