import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { LeaguesService } from "./leagues.service.js";
import { LeaguesQueryService } from "./leagues.query.service.js";
import { LeaguesMutationService } from "./leagues.mutation.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { LeagueMembersUtilService } from "../leagueMembers/leagueMembers.util.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service.js";
import {
  DBLeague,
  LEAGUE_INCLUDES,
  LEAGUE_VISIBILITIES,
  PICK_EM_PICK_TYPES,
} from "./leagues.types.js";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types.js";
import {
  DBLeagueType,
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../leagueTypes/leagueTypes.types.js";
import { LeaguesUtilService } from "./leagues.util.service.js";
import {
  DBPhaseTemplate,
  PHASE_TEMPLATE_TYPES,
} from "../phaseTemplates/phaseTemplates.types.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
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
  let leagueMembersUtilService: MockProxy<LeagueMembersUtilService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let phaseTemplatesQueryService: MockProxy<PhaseTemplatesQueryService>;
  let leaguesUtilService: MockProxy<LeaguesUtilService>;

  beforeEach(() => {
    leaguesQueryService = mock<LeaguesQueryService>();
    leaguesMutationService = mock<LeaguesMutationService>();
    leagueMembersQueryService = mock<LeagueMembersQueryService>();
    leagueMembersUtilService = mock<LeagueMembersUtilService>();
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    phaseTemplatesQueryService = mock<PhaseTemplatesQueryService>();
    leaguesUtilService = mock<LeaguesUtilService>();

    leaguesService = new LeaguesService(
      leaguesQueryService,
      leaguesMutationService,
      leagueMembersQueryService,
      leagueTypesQueryService,
      phaseTemplatesQueryService,
      leaguesUtilService,
      leagueMembersUtilService,
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

  describe("create", () => {
    const userId = "user-1";
    const createData = {
      name: "My League",
      image: null,
      leagueTypeSlug: LEAGUE_TYPE_SLUGS.PICK_EM,
      startPhaseTemplateId: "phase-start-1",
      endPhaseTemplateId: "phase-end-1",
      visibility: LEAGUE_VISIBILITIES.PRIVATE,
      size: 10,
      settings: { picksPerPhase: 5, pickType: PICK_EM_PICK_TYPES.STRAIGHT_UP },
    };

    it("throws when league type not found", async () => {
      leagueTypesQueryService.findBySlug.mockResolvedValue(null);

      await expect(leaguesService.create(userId, createData)).rejects.toThrow(
        new NotFoundError("League type not found"),
      );
    });

    it("throws when start phase template not found", async () => {
      leagueTypesQueryService.findBySlug.mockResolvedValue({
        id: "type-1",
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        description: "",
        sportLeagueId: "sport-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      phaseTemplatesQueryService.findById.mockResolvedValueOnce(null);

      await expect(leaguesService.create(userId, createData)).rejects.toThrow(
        new NotFoundError("Start phase template not found"),
      );
    });

    it("throws when end phase template not found", async () => {
      leagueTypesQueryService.findBySlug.mockResolvedValue({
        id: "type-1",
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        description: "",
        sportLeagueId: "sport-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const startTemplate: DBPhaseTemplate = {
        id: "phase-start-1",
        sportLeagueId: "sport-1",
        label: "Week 1",
        sequence: 1,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      phaseTemplatesQueryService.findById.mockResolvedValueOnce(startTemplate);
      phaseTemplatesQueryService.findById.mockResolvedValueOnce(null);

      await expect(leaguesService.create(userId, createData)).rejects.toThrow(
        new NotFoundError("End phase template not found"),
      );
    });

    it("throws when start phase is after end phase", async () => {
      leagueTypesQueryService.findBySlug.mockResolvedValue({
        id: "type-1",
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        description: "",
        sportLeagueId: "sport-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const startTemplate: DBPhaseTemplate = {
        id: "phase-start-1",
        sportLeagueId: "sport-1",
        label: "Week 5",
        sequence: 5,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const endTemplate: DBPhaseTemplate = {
        id: "phase-end-1",
        sportLeagueId: "sport-1",
        label: "Week 3",
        sequence: 3,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      phaseTemplatesQueryService.findById.mockResolvedValueOnce(startTemplate);
      phaseTemplatesQueryService.findById.mockResolvedValueOnce(endTemplate);

      await expect(leaguesService.create(userId, createData)).rejects.toThrow(
        new ValidationError("Start phase cannot be after end phase"),
      );
    });

    it("creates league and commissioner membership on success", async () => {
      leagueTypesQueryService.findBySlug.mockResolvedValue({
        id: "type-1",
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        description: "",
        sportLeagueId: "sport-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const startTemplate: DBPhaseTemplate = {
        id: "phase-start-1",
        sportLeagueId: "sport-1",
        label: "Week 1",
        sequence: 1,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const endTemplate: DBPhaseTemplate = {
        id: "phase-end-1",
        sportLeagueId: "sport-1",
        label: "Week 10",
        sequence: 10,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      phaseTemplatesQueryService.findById.mockResolvedValueOnce(startTemplate);
      phaseTemplatesQueryService.findById.mockResolvedValueOnce(endTemplate);

      const createdLeague: DBLeague = {
        id: "league-1",
        name: createData.name,
        image: null,
        leagueTypeId: "type-1",
        startPhaseTemplateId: createData.startPhaseTemplateId,
        endPhaseTemplateId: createData.endPhaseTemplateId,
        visibility: createData.visibility,
        size: createData.size,
        settings: createData.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      leaguesMutationService.create.mockResolvedValue(createdLeague);

      const result = await leaguesService.create(userId, createData);

      expect(leaguesMutationService.create).toHaveBeenCalledWith(
        { ...createData, leagueTypeId: "type-1" },
        undefined,
      );
      expect(
        leagueMembersUtilService.addMemberAndInitializeStandings,
      ).toHaveBeenCalledWith(
        createdLeague.id,
        userId,
        LEAGUE_MEMBER_ROLES.COMMISSIONER,
        undefined,
      );
      expect(result).toEqual(createdLeague);
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
