import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { PhasesService } from "./phases.service.js";
import { PhasesQueryService } from "./phases.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { EventsQueryService } from "../events/events.query.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";
import { DBPhase } from "./phases.types.js";
import { DBLeague } from "../leagues/leagues.types.js";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types.js";

// Mock the database transaction
vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn((callback) => callback()),
  },
}));

describe("PhasesService", () => {
  const phasesQueryService = mock<PhasesQueryService>();
  const leaguesQueryService = mock<LeaguesQueryService>();
  const leagueMembersQueryService = mock<LeagueMembersQueryService>();
  const eventsQueryService = mock<EventsQueryService>();
  const liveScoresQueryService = mock<LiveScoresQueryService>();
  const outcomesQueryService = mock<OutcomesQueryService>();
  const oddsQueryService = mock<OddsQueryService>();
  const sportsbooksQueryService = mock<SportsbooksQueryService>();
  const teamsQueryService = mock<TeamsQueryService>();

  let phasesService: PhasesService;

  beforeEach(() => {
    phasesService = new PhasesService(
      phasesQueryService,
      mock(), // PhasesMutationService
      mock(), // PhaseTemplatesQueryService
      mock(), // EspnService
      mock(), // DataSourcesQueryService
      mock(), // SeasonsQueryService
      mock(), // SportLeaguesQueryService
      mock(), // SeasonsUtilService
      eventsQueryService,
      liveScoresQueryService,
      oddsQueryService,
      sportsbooksQueryService,
      outcomesQueryService,
      leaguesQueryService,
      leagueMembersQueryService,
      teamsQueryService,
    );
  });

  describe("getCurrentPhaseForLeague", () => {
    it("should return current phase for a league", async () => {
      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      const mockCurrentPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      phasesQueryService.findCurrentPhases.mockResolvedValue([
        mockCurrentPhase,
      ]);

      const result = await phasesService.getCurrentPhaseForLeague(
        "user-1",
        "league-1",
      );

      expect(result).toEqual({
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: mockCurrentPhase.startDate,
        endDate: mockCurrentPhase.endDate,
        createdAt: mockCurrentPhase.createdAt,
        updatedAt: mockCurrentPhase.updatedAt,
      });
    });

    it("should throw NotFoundError when league not found", async () => {
      leaguesQueryService.findById.mockResolvedValue(null);

      await expect(
        phasesService.getCurrentPhaseForLeague("user-1", "non-existent-league"),
      ).rejects.toThrow(new NotFoundError("League not found"));
    });

    it("should throw ForbiddenError when user is not a member of the league", async () => {
      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(
        phasesService.getCurrentPhaseForLeague("user-1", "league-1"),
      ).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should throw NotFoundError when no current phase found", async () => {
      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      phasesQueryService.findCurrentPhases.mockResolvedValue([]);

      await expect(
        phasesService.getCurrentPhaseForLeague("user-1", "league-1"),
      ).rejects.toThrow(
        new NotFoundError("No current phase found for this league"),
      );
    });

    it("should include previous and next phases when requested", async () => {
      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      const mockCurrentPhase: DBPhase = {
        id: "phase-2",
        seasonId: "season-1",
        phaseTemplateId: "template-2",
        sequence: 2,
        startDate: new Date("2024-01-08"),
        endDate: new Date("2024-01-14"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPreviousPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockNextPhase: DBPhase = {
        id: "phase-3",
        seasonId: "season-1",
        phaseTemplateId: "template-3",
        sequence: 3,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-21"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      phasesQueryService.findCurrentPhases.mockResolvedValue([
        mockCurrentPhase,
      ]);
      phasesQueryService.findPreviousPhase.mockResolvedValue(mockPreviousPhase);
      phasesQueryService.findNextPhase.mockResolvedValue(mockNextPhase);

      const result = await phasesService.getCurrentPhaseForLeague(
        "user-1",
        "league-1",
        ["previousPhase", "nextPhase"],
      );

      expect(result.previousPhase).toEqual(mockPreviousPhase);

      expect(result.nextPhase).toEqual(mockNextPhase);
    });

    it("should get phase by ID with events", async () => {
      const mockPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      phasesQueryService.findById.mockResolvedValue(mockPhase);
      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );

      const result = await phasesService.getPhaseByIdAndLeagueId(
        "user-1",
        "phase-1",
        "league-1",
        [],
      );

      expect(result).toEqual(mockPhase);
    });

    it("should throw NotFoundError when phase not found", async () => {
      phasesQueryService.findById.mockResolvedValue(null);

      await expect(
        phasesService.getPhaseByIdAndLeagueId(
          "user-1",
          "non-existent-phase",
          "league-1",
          [],
        ),
      ).rejects.toThrow(new NotFoundError("Phase not found"));
    });

    it("should throw ForbiddenError when user is not a member of the league for phase by ID", async () => {
      const mockPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      phasesQueryService.findById.mockResolvedValue(mockPhase);
      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(
        phasesService.getPhaseByIdAndLeagueId(
          "user-1",
          "phase-1",
          "league-1",
          [],
        ),
      ).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should throw NotFoundError when leagueId doesn't match phase's league", async () => {
      const mockPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      phasesQueryService.findById.mockResolvedValue(mockPhase);
      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);

      await expect(
        phasesService.getPhaseByIdAndLeagueId(
          "user-1",
          "phase-1",
          "league-2",
          [],
        ),
      ).rejects.toThrow(new NotFoundError("Phase not found in this league"));
    });
  });
});
