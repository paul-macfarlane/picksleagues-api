import { describe, it, expect, beforeEach } from "vitest";
import { mock } from "vitest-mock-extended";
import { PicksService } from "./picks.service.js";
import { PicksQueryService } from "./picks.query.service.js";
import { EventsQueryService } from "../events/events.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { PhasesUtilService } from "../phases/phases.util.service.js";
import { ForbiddenError } from "../../lib/errors.js";
import {
  DBLeagueMember,
  LEAGUE_MEMBER_ROLES,
} from "../leagueMembers/leagueMembers.types.js";
import { DBEvent, EVENT_TYPES } from "../events/events.types.js";
import { DBPick } from "./picks.types.js";

describe("PicksService", () => {
  const picksQueryService = mock<PicksQueryService>();
  const eventsQueryService = mock<EventsQueryService>();
  const profilesQueryService = mock<ProfilesQueryService>();
  const teamsQueryService = mock<TeamsQueryService>();
  const liveScoresQueryService = mock<LiveScoresQueryService>();
  const outcomesQueryService = mock<OutcomesQueryService>();
  const oddsQueryService = mock<OddsQueryService>();
  const sportsbooksQueryService = mock<SportsbooksQueryService>();
  const leagueMembersQueryService = mock<LeagueMembersQueryService>();
  const phasesUtilService = mock<PhasesUtilService>();

  let picksService: PicksService;

  beforeEach(() => {
    picksService = new PicksService(
      picksQueryService,
      eventsQueryService,
      profilesQueryService,
      teamsQueryService,
      liveScoresQueryService,
      outcomesQueryService,
      oddsQueryService,
      sportsbooksQueryService,
      leagueMembersQueryService,
      phasesUtilService,
    );
  });

  describe("getPicksForUserInPhase", () => {
    it("should return user picks for phase", async () => {
      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      const mockEvents: DBEvent[] = [
        {
          id: "event-1",
          phaseId: "phase-1",
          startTime: new Date("2024-01-10T20:00:00Z"),
          type: EVENT_TYPES.GAME,
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPicks: DBPick[] = [
        {
          id: "pick-1",
          leagueId: "league-1",
          userId: "user-1",
          eventId: "event-1",
          teamId: "team-1",
          spread: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      eventsQueryService.listByPhaseIds.mockResolvedValue(mockEvents);
      picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue(
        mockPicks,
      );

      const result = await picksService.getPicksForUserInPhase(
        "user-1",
        "league-1",
        "phase-1",
      );

      expect(result).toEqual(mockPicks);
    });

    it("should throw ForbiddenError when user is not a member of the league", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(
        picksService.getPicksForUserInPhase("user-1", "league-1", "phase-1"),
      ).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should return empty array when no events found for phase", async () => {
      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      eventsQueryService.listByPhaseIds.mockResolvedValue([]);

      const result = await picksService.getPicksForUserInPhase(
        "user-1",
        "league-1",
        "phase-1",
      );

      expect(result).toEqual([]);
    });
  });

  describe("getAllPicksForLeagueAndPhase", () => {
    it("should return all picks for league and phase", async () => {
      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      const mockEvents: DBEvent[] = [
        {
          id: "event-1",
          phaseId: "phase-1",
          startTime: new Date("2024-01-10T20:00:00Z"),
          type: EVENT_TYPES.GAME,
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPicks: DBPick[] = [
        {
          id: "pick-1",
          leagueId: "league-1",
          userId: "user-1",
          eventId: "event-1",
          teamId: "team-1",
          spread: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pick-2",
          leagueId: "league-1",
          userId: "user-2",
          eventId: "event-1",
          teamId: "team-2",
          spread: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      eventsQueryService.listByPhaseIds.mockResolvedValue(mockEvents);
      picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue(
        mockPicks,
      );

      const result = await picksService.getPicksForUserInPhase(
        "user-1",
        "league-1",
        "phase-1",
      );

      expect(result).toEqual(mockPicks);
    });

    it("should throw ForbiddenError when user is not a member of the league", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(
        picksService.getAllPicksForLeagueAndPhase(
          "user-1",
          "league-1",
          "phase-1",
        ),
      ).rejects.toThrow(
        new ForbiddenError("You are not a member of this league"),
      );
    });

    it("should return empty array when no events found for phase", async () => {
      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      eventsQueryService.listByPhaseIds.mockResolvedValue([]);

      const result = await picksService.getAllPicksForLeagueAndPhase(
        "user-1",
        "league-1",
        "phase-1",
      );

      expect(result).toEqual([]);
    });
  });

  describe("getPicksForUserInCurrentPhase", () => {
    it("should return user picks for current phase", async () => {
      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      const mockEvents: DBEvent[] = [
        {
          id: "event-1",
          phaseId: "phase-1",
          startTime: new Date("2024-01-10T20:00:00Z"),
          type: EVENT_TYPES.GAME,
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPicks: DBPick[] = [
        {
          id: "pick-1",
          leagueId: "league-1",
          userId: "user-1",
          eventId: "event-1",
          teamId: "team-1",
          spread: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      phasesUtilService.getCurrentPhaseForLeague.mockResolvedValue({
        id: "phase-1",
      });
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      eventsQueryService.listByPhaseIds.mockResolvedValue(mockEvents);
      picksQueryService.findByUserIdAndLeagueIdAndEventIds.mockResolvedValue(
        mockPicks,
      );

      const result = await picksService.getPicksForUserInCurrentPhase(
        "user-1",
        "league-1",
      );

      expect(result).toEqual(mockPicks);
    });
  });

  describe("getAllPicksForCurrentPhase", () => {
    it("should return all picks for current phase", async () => {
      const mockMember: Partial<DBLeagueMember> = {
        leagueId: "league-1",
        userId: "user-1",
        role: LEAGUE_MEMBER_ROLES.MEMBER,
      };

      const mockEvents: DBEvent[] = [
        {
          id: "event-1",
          phaseId: "phase-1",
          startTime: new Date("2024-01-10T20:00:00Z"),
          type: EVENT_TYPES.GAME,
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockPicks: DBPick[] = [
        {
          id: "pick-1",
          leagueId: "league-1",
          userId: "user-1",
          eventId: "event-1",
          teamId: "team-1",
          spread: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pick-2",
          leagueId: "league-1",
          userId: "user-2",
          eventId: "event-1",
          teamId: "team-2",
          spread: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      phasesUtilService.getCurrentPhaseForLeague.mockResolvedValue({
        id: "phase-1",
      });
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(
        mockMember as DBLeagueMember,
      );
      eventsQueryService.listByPhaseIds.mockResolvedValue(mockEvents);
      picksQueryService.findByLeagueIdAndEventIds.mockResolvedValue(mockPicks);

      const result = await picksService.getAllPicksForCurrentPhase(
        "user-1",
        "league-1",
      );

      expect(result).toEqual(mockPicks);
    });
  });
});
