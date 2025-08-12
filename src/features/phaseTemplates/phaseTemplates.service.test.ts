import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { PhaseTemplatesService } from "./phaseTemplates.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { PhaseTemplatesQueryService } from "./phaseTemplates.query.service.js";
import { PhaseTemplatesMutationService } from "./phaseTemplates.mutation.service.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";
import { NotFoundError } from "../../lib/errors.js";
import {
  DBPhaseTemplate,
  PHASE_TEMPLATE_TYPES,
} from "./phaseTemplates.types.js";
import {
  DBLeagueType,
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../leagueTypes/leagueTypes.types.js";
import { DBSportLeague } from "../sportLeagues/sportLeagues.types.js";
import { DBSeason } from "../seasons/seasons.types.js";
import { DBPhase } from "../phases/phases.types.js";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("PhaseTemplatesService.listByLeagueTypeIdOrSlug", () => {
  let service: PhaseTemplatesService;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let sportLeaguesQueryService: MockProxy<SportLeaguesQueryService>;
  let phaseTemplatesQueryService: MockProxy<PhaseTemplatesQueryService>;
  let phaseTemplatesMutationService: MockProxy<PhaseTemplatesMutationService>;
  let seasonsQueryService: MockProxy<SeasonsQueryService>;
  let phasesQueryService: MockProxy<PhasesQueryService>;

  beforeEach(() => {
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    sportLeaguesQueryService = mock<SportLeaguesQueryService>();
    phaseTemplatesQueryService = mock<PhaseTemplatesQueryService>();
    phaseTemplatesMutationService = mock<PhaseTemplatesMutationService>();
    seasonsQueryService = mock<SeasonsQueryService>();
    phasesQueryService = mock<PhasesQueryService>();

    service = new PhaseTemplatesService(
      leagueTypesQueryService,
      sportLeaguesQueryService,
      phaseTemplatesQueryService,
      phaseTemplatesMutationService,
      seasonsQueryService,
      phasesQueryService,
    );
  });

  it("throws when league type not found", async () => {
    leagueTypesQueryService.findBySlug.mockResolvedValue(null);

    await expect(
      service.listByLeagueTypeIdOrSlug(LEAGUE_TYPE_SLUGS.PICK_EM),
    ).rejects.toThrow(new NotFoundError("League type not found"));
  });

  it("returns all templates when there is no current season (offseason)", async () => {
    const leagueType: DBLeagueType = {
      id: "type-1",
      name: LEAGUE_TYPE_NAMES.PICK_EM,
      slug: LEAGUE_TYPE_SLUGS.PICK_EM,
      description: "",
      sportLeagueId: "sport-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sportLeague: DBSportLeague = {
      id: "sport-1",
      name: "NFL",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const templates: DBPhaseTemplate[] = [
      {
        id: "tpl-1",
        sportLeagueId: "sport-1",
        label: "Week 1",
        sequence: 1,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tpl-2",
        sportLeagueId: "sport-1",
        label: "Week 2",
        sequence: 2,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    leagueTypesQueryService.findBySlug.mockResolvedValue(leagueType);
    sportLeaguesQueryService.findById.mockResolvedValue(sportLeague);
    phaseTemplatesQueryService.listBySportLeagueId.mockResolvedValue(templates);
    seasonsQueryService.findCurrentBySportLeagueId.mockResolvedValue(null);

    const result = await service.listByLeagueTypeIdOrSlug(
      LEAGUE_TYPE_SLUGS.PICK_EM,
    );

    expect(phaseTemplatesQueryService.listBySportLeagueId).toHaveBeenCalledWith(
      "sport-1",
      expect.anything(),
    );
    expect(result).toEqual(templates);
  });

  it("filters templates to only those with future phases in the active season", async () => {
    const leagueType: DBLeagueType = {
      id: "type-1",
      name: LEAGUE_TYPE_NAMES.PICK_EM,
      slug: LEAGUE_TYPE_SLUGS.PICK_EM,
      description: "",
      sportLeagueId: "sport-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sportLeague: DBSportLeague = {
      id: "sport-1",
      name: "NFL",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const season: DBSeason = {
      id: "season-1",
      name: "2024",
      year: "2024",
      sportLeagueId: "sport-1",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // started last week
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // ends next week
    };

    const templates: DBPhaseTemplate[] = [
      {
        id: "tpl-1",
        sportLeagueId: "sport-1",
        label: "Week 1",
        sequence: 1,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tpl-2",
        sportLeagueId: "sport-1",
        label: "Week 2",
        sequence: 2,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tpl-3",
        sportLeagueId: "sport-1",
        label: "Week 3",
        sequence: 3,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const phases: DBPhase[] = [
      {
        id: "phase-1",
        seasonId: season.id,
        phaseTemplateId: "tpl-1",
        sequence: 1,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // past
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        pickLockTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "phase-2",
        seasonId: season.id,
        phaseTemplateId: "tpl-2",
        sequence: 2,
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // future
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        pickLockTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "phase-3",
        seasonId: season.id,
        phaseTemplateId: "tpl-3",
        sequence: 3,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // past
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        pickLockTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    leagueTypesQueryService.findBySlug.mockResolvedValue(leagueType);
    sportLeaguesQueryService.findById.mockResolvedValue(sportLeague);
    phaseTemplatesQueryService.listBySportLeagueId.mockResolvedValue(templates);
    seasonsQueryService.findCurrentBySportLeagueId.mockResolvedValue(season);
    phasesQueryService.listBySeasonIds.mockResolvedValue(phases);

    const result = await service.listByLeagueTypeIdOrSlug(
      LEAGUE_TYPE_SLUGS.PICK_EM,
      { excludeStarted: true },
    );

    // Only template with future phase (tpl-2) should be included
    expect(result).toEqual([expect.objectContaining({ id: "tpl-2" })]);
    expect(result).toHaveLength(1);
  });
});
