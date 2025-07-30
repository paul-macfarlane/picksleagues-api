import { describe, it, expect, beforeEach } from "vitest";
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
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service.js";
import { PhasesUtilService } from "./phases.util.service.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";
import { DBPhase } from "./phases.types.js";
import { DBLeague } from "../leagues/leagues.types.js";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types.js";
import { DBPhaseTemplate } from "../phaseTemplates/phaseTemplates.types.js";
import { PHASE_TEMPLATE_TYPES } from "../phaseTemplates/phaseTemplates.types.js";

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
  const phaseTemplatesQueryService = mock<PhaseTemplatesQueryService>();
  const phasesUtilService = mock<PhasesUtilService>();

  let phasesService: PhasesService;

  beforeEach(() => {
    phasesService = new PhasesService(
      phasesQueryService,
      mock(), // PhasesMutationService
      phaseTemplatesQueryService,
      phasesUtilService,
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
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      phasesUtilService.getCurrentOrNextPhaseForLeagueForUser.mockResolvedValue(
        {
          id: "phase-1",
        },
      );
      phasesQueryService.findById.mockResolvedValue(mockCurrentPhase);
      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );

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
        pickLockTime: mockCurrentPhase.pickLockTime,
        createdAt: mockCurrentPhase.createdAt,
        updatedAt: mockCurrentPhase.updatedAt,
      });
    });

    it("should throw NotFoundError when league not found", async () => {
      phasesUtilService.getCurrentOrNextPhaseForLeagueForUser.mockRejectedValue(
        new NotFoundError("League not found"),
      );

      await expect(
        phasesService.getCurrentPhaseForLeague("user-1", "non-existent-league"),
      ).rejects.toThrow(new NotFoundError("League not found"));
    });

    it("should throw ForbiddenError when user is not a member of the league", async () => {
      phasesUtilService.getCurrentOrNextPhaseForLeagueForUser.mockRejectedValue(
        new ForbiddenError("You are not a member of this league"),
      );

      await expect(
        phasesService.getCurrentPhaseForLeague("user-1", "league-1"),
      ).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should throw NotFoundError when no current phase found", async () => {
      phasesUtilService.getCurrentOrNextPhaseForLeagueForUser.mockRejectedValue(
        new NotFoundError("No current or next phase found for this league"),
      );

      await expect(
        phasesService.getCurrentPhaseForLeague("user-1", "league-1"),
      ).rejects.toThrow(
        new NotFoundError("No current or next phase found for this league"),
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
        pickLockTime: new Date("2024-01-14T18:00:00Z"), // Sunday 1PM ET
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
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
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
        pickLockTime: new Date("2024-01-21T18:00:00Z"), // Sunday 1PM ET
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      phasesUtilService.getCurrentOrNextPhaseForLeagueForUser.mockResolvedValue(
        {
          id: "phase-2",
        },
      );
      phasesQueryService.findById.mockResolvedValue(mockCurrentPhase);
      leaguesQueryService.findById.mockResolvedValue(mockLeague as DBLeague);
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
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
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
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

    it("should return phase when user is member of different league", async () => {
      const mockPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
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
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
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
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague: Partial<DBLeague> = {
        id: "league-2",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-2",
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
        "league-2",
        [],
      );

      expect(result).toEqual(mockPhase);
    });

    it("should include phase template when requested", async () => {
      const mockPhase: DBPhase = {
        id: "phase-1",
        seasonId: "season-1",
        phaseTemplateId: "template-1",
        sequence: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        pickLockTime: new Date("2024-01-07T18:00:00Z"), // Sunday 1PM ET
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLeague: Partial<DBLeague> = {
        id: "league-1",
        startPhaseTemplateId: "start-template-1",
        endPhaseTemplateId: "end-template-1",
      };

      const mockPhaseTemplate: DBPhaseTemplate = {
        id: "template-1",
        sportLeagueId: "sport-league-1",
        label: "Week 1",
        sequence: 1,
        type: PHASE_TEMPLATE_TYPES.WEEK,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      phaseTemplatesQueryService.findById.mockResolvedValue(mockPhaseTemplate);

      const result = await phasesService.getPhaseByIdAndLeagueId(
        "user-1",
        "phase-1",
        "league-1",
        ["phaseTemplate"],
      );

      expect(result).toEqual({
        ...mockPhase,
        phaseTemplate: mockPhaseTemplate,
      });
      expect(phaseTemplatesQueryService.findById).toHaveBeenCalledWith(
        "template-1",
      );
    });
  });
});
