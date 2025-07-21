import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { LeaguesService } from "./leagues.service";
import { LeaguesQueryService } from "./leagues.query.service";
import { LeaguesMutationService } from "./leagues.mutation.service";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service";
import { LeagueMembersMutationService } from "../leagueMembers/leagueMembers.mutation.service";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service";
import {
  DBLeague,
  LEAGUE_INCLUDES,
  LEAGUE_VISIBILITIES,
  PICK_EM_PICK_TYPES,
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
import { LeaguesUtilService } from "./leagues.util.service";
import { ForbiddenError } from "../../lib/errors";
import { vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("LeaguesService", () => {
  let leaguesService: LeaguesService;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leaguesMutationService: MockProxy<LeaguesMutationService>;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let phaseTemplatesQueryService: MockProxy<PhaseTemplatesQueryService>;
  let leaguesUtilService: MockProxy<LeaguesUtilService>;

  beforeEach(() => {
    leaguesQueryService = mock<LeaguesQueryService>();
    leaguesMutationService = mock<LeaguesMutationService>();
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    leagueMembersMutationService = mock<LeagueMembersMutationService>();
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    phaseTemplatesQueryService = mock<PhaseTemplatesQueryService>();
    leaguesUtilService = mock<LeaguesUtilService>();

    leaguesService = new LeaguesService(
      leaguesQueryService,
      leaguesMutationService,
      leagueMembersQueryService,
      leagueMembersMutationService,
      leagueTypesQueryService,
      phaseTemplatesQueryService,
      leaguesUtilService,
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

  describe("delete", () => {
    const leagueId = "league-1";
    const userId = "user-1";

    it("should throw an error if the user is not a member of the league", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(leaguesService.delete(userId, leagueId)).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should throw an error if the user is not a commissioner", async () => {
      const member: DBLeagueMember = {
        leagueId,
        userId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);

      await expect(leaguesService.delete(userId, leagueId)).rejects.toThrow(
        new ForbiddenError("You must be a commissioner to delete this league"),
      );
    });

    it("should delete the league and its members if the user is a commissioner", async () => {
      const member: DBLeagueMember = {
        leagueId,
        userId,
        role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);

      await leaguesService.delete(userId, leagueId);

      expect(leaguesMutationService.delete).toHaveBeenCalledWith(
        leagueId,
        undefined,
      );
    });
  });

  describe("updateSettings", () => {
    const leagueId = "league-1";
    const userId = "user-1";
    const league: DBLeague = {
      id: leagueId,
      name: "Original Name",
      image: "original.jpg",
      leagueTypeId: "type-1",
      startPhaseTemplateId: "phase-1",
      endPhaseTemplateId: "phase-2",
      visibility: LEAGUE_VISIBILITIES.PRIVATE,
      size: 10,
      settings: {
        picksPerPhase: 5,
        pickType: PICK_EM_PICK_TYPES.STRAIGHT_UP,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const commissioner: DBLeagueMember = {
      leagueId,
      userId,
      role: LEAGUE_MEMBER_ROLES.COMMISSIONER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should throw an error if the user is not a member of the league", async () => {
      leaguesQueryService.findById.mockResolvedValue(league);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(leaguesService.update(userId, leagueId, {})).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should throw an error if the user is not a commissioner", async () => {
      const member: DBLeagueMember = {
        ...commissioner,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };
      leaguesQueryService.findById.mockResolvedValue(league);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(member);

      await expect(leaguesService.update(userId, leagueId, {})).rejects.toThrow(
        new ForbiddenError(
          "You must be a commissioner to edit this league's settings",
        ),
      );
    });

    it("should allow a commissioner to update name and image when in-season", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        commissioner,
      );
      leaguesQueryService.findById.mockResolvedValue(league);
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(true);
      leaguesMutationService.update.mockResolvedValue({
        ...league,
        name: "New Name",
        image: "new.jpg",
      });

      const updates = { name: "New Name", image: "new.jpg" };
      const result = await leaguesService.update(userId, leagueId, updates);

      expect(leaguesMutationService.update).toHaveBeenCalledWith(
        leagueId,
        updates,
        undefined,
      );
      expect(result.name).toBe("New Name");
    });

    it("should prevent updating other settings when in-season", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        commissioner,
      );
      leaguesQueryService.findById.mockResolvedValue(league);
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(true);

      await expect(
        leaguesService.update(userId, leagueId, { size: 12 }),
      ).rejects.toThrow(
        new ForbiddenError(
          "Some settings cannot be changed while the league is in season.",
        ),
      );
    });

    it("should prevent updating league size to be smaller than current member count", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        commissioner,
      );
      leaguesQueryService.findById.mockResolvedValue(league);
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        commissioner,
        { ...commissioner, userId: "user-2" },
      ]); // 2 members

      await expect(
        leaguesService.update(userId, leagueId, { size: 1 }),
      ).rejects.toThrow(
        "League size cannot be smaller than the current number of members.",
      );
    });

    it("should allow a commissioner to update all settings when not in-season", async () => {
      const updates = {
        name: "New Name",
        image: "new.jpg",
        startPhaseTemplateId: "new-phase-1",
        endPhaseTemplateId: "new-phase-2",
        size: 15,
        settings: { picksPerPhase: 10, pickType: PICK_EM_PICK_TYPES.SPREAD },
      };
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        commissioner,
      );
      leaguesQueryService.findById.mockResolvedValue(league);
      leaguesUtilService.leagueSeasonInProgress.mockResolvedValue(false);
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([]);
      leaguesMutationService.update.mockResolvedValue({
        ...league,
        ...updates,
      });

      const result = await leaguesService.update(userId, leagueId, updates);

      expect(leaguesMutationService.update).toHaveBeenCalledWith(
        leagueId,
        updates,
        undefined,
      );
      expect(result.name).toBe(updates.name);
      expect(result.size).toBe(updates.size);
    });
  });
});
