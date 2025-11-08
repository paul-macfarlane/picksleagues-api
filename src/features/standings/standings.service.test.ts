import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockProxy, mockDeep } from "vitest-mock-extended";
import { StandingsService } from "./standings.service.js";
import { StandingsQueryService } from "./standings.query.service.js";
import { StandingsMutationService } from "./standings.mutation.service.js";
import { PicksQueryService } from "../picks/picks.query.service.js";
import { PicksMutationService } from "../picks/picks.mutation.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types.js";
import {
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../leagueTypes/leagueTypes.types.js";
import { LEAGUE_VISIBILITIES } from "../leagues/leagues.types.js";
import { PICK_RESULTS, UnassessedPick } from "../picks/picks.types.js";

describe("StandingsService", () => {
  let standingsService: StandingsService;
  let standingsQueryService: MockProxy<StandingsQueryService>;
  let standingsMutationService: MockProxy<StandingsMutationService>;
  let picksQueryService: MockProxy<PicksQueryService>;
  let picksMutationService: MockProxy<PicksMutationService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueMembersQueryService: MockProxy<LeagueMembersQueryService>;
  let seasonsUtilService: MockProxy<SeasonsUtilService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let profilesQueryService: MockProxy<ProfilesQueryService>;

  beforeEach(() => {
    standingsQueryService = mockDeep<StandingsQueryService>();
    standingsMutationService = mockDeep<StandingsMutationService>();
    picksQueryService = mockDeep<PicksQueryService>();
    picksMutationService = mockDeep<PicksMutationService>();
    leaguesQueryService = mockDeep<LeaguesQueryService>();
    leagueMembersQueryService = mockDeep<LeagueMembersQueryService>();
    seasonsUtilService = mockDeep<SeasonsUtilService>();
    leagueTypesQueryService = mockDeep<LeagueTypesQueryService>();
    profilesQueryService = mockDeep<ProfilesQueryService>();

    standingsService = new StandingsService(
      standingsQueryService,
      standingsMutationService,
      picksQueryService,
      picksMutationService,
      leaguesQueryService,
      leagueMembersQueryService,
      seasonsUtilService,
      leagueTypesQueryService,
      profilesQueryService,
    );
  });

  describe("getCurrentStandingsForUser", () => {
    const leagueId = "league-1";
    const userId = "user-1";
    const seasonId = "season-1";
    const leagueTypeId = "league-type-1";
    const sportLeagueId = "sport-league-1";

    it("should return standings for a user in a league", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      const mockStandings = {
        id: "standings-1",
        userId,
        leagueId,
        seasonId,
        points: 10,
        rank: 1,
        metadata: { wins: 5, losses: 2, pushes: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      standingsQueryService.findByUserLeagueSeason.mockResolvedValue(
        mockStandings,
      );
      profilesQueryService.listByUserIds.mockResolvedValue([
        {
          userId,
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await standingsService.getCurrentStandingsForUser(
        leagueId,
        userId,
        {
          include: ["profile"],
        },
      );

      expect(result).toEqual({
        ...mockStandings,
        profile: {
          userId,
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          avatarUrl: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should throw ForbiddenError if user is not a member of the league", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue(null);

      await expect(
        standingsService.getCurrentStandingsForUser(leagueId, userId),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError if league does not exist", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue(null);

      await expect(
        standingsService.getCurrentStandingsForUser(leagueId, userId),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if league type does not exist", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue(null);

      await expect(
        standingsService.getCurrentStandingsForUser(leagueId, userId),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if no current season exists", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        null,
      );

      await expect(
        standingsService.getCurrentStandingsForUser(leagueId, userId),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if no standings exist for the user", async () => {
      leagueMembersQueryService.findByLeagueAndUserId.mockResolvedValue({
        userId,
        leagueId,
        role: LEAGUE_MEMBER_ROLES.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      standingsQueryService.findByUserLeagueSeason.mockResolvedValue(null);

      await expect(
        standingsService.getCurrentStandingsForUser(leagueId, userId),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("calculateStandingsForLeague", () => {
    const leagueId = "league-1";
    const seasonId = "season-1";
    const userId1 = "user-1";
    const userId2 = "user-2";
    const leagueTypeId = "league-type-1";
    const sportLeagueId = "sport-league-1";

    vi.mock("../../db", () => ({
      db: {
        transaction: vi.fn((callback) => callback()),
      },
    }));

    beforeEach(() => {
      vi.clearAllMocks();
      standingsQueryService.findByLeagueSeason.mockReset();
      standingsMutationService.update.mockReset();
      standingsMutationService.create.mockReset();
      picksQueryService.findUnassessedPicksForLeague.mockReset();
      picksMutationService.update.mockReset();
      leagueMembersQueryService.listByLeagueId.mockReset();
      picksQueryService.findByUserIdAndLeagueId.mockReset();
    });

    it("should recalculate standings correctly from all assessed picks", async () => {
      // No unassessed picks - just testing recalculation
      picksQueryService.findUnassessedPicksForLeague.mockResolvedValue([]);

      // Setup league and season info for recalculation
      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      // Setup league members for recalculation
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // User has 3 wins and 1 loss already assessed
      picksQueryService.findByUserIdAndLeagueId.mockResolvedValue([
        {
          id: "pick-1",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-1",
          teamId: "team-1",
          spread: null,
          result: PICK_RESULTS.WIN,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pick-2",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-2",
          teamId: "team-2",
          spread: null,
          result: PICK_RESULTS.WIN,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pick-3",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-3",
          teamId: "team-3",
          spread: null,
          result: PICK_RESULTS.WIN,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pick-4",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-4",
          teamId: "team-4",
          spread: null,
          result: PICK_RESULTS.LOSS,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Existing standings have INCORRECT data (simulating a bug that was fixed)
      standingsQueryService.findByUserLeagueSeason.mockResolvedValue({
        userId: userId1,
        leagueId,
        seasonId,
        points: 999, // Wrong value - should be recalculated to 3
        rank: 1,
        metadata: { wins: 999, losses: 999, pushes: 0 }, // Wrong metadata
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      standingsQueryService.findByLeagueSeason.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          seasonId,
          points: 3, // Will be recalculated
          rank: 1,
          metadata: { wins: 3, losses: 1, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await standingsService.calculateStandingsForLeagues([leagueId]);

      // Should recalculate standings to correct values
      // The key test: verify that points are RECALCULATED (not accumulated)
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        userId1,
        leagueId,
        seasonId,
        expect.objectContaining({
          points: 3, // Correct: 3 wins = 3 points (not 999 + 3!)
          metadata: { wins: 3, losses: 1, pushes: 0 },
        }),
        undefined,
      );
    });

    it("should calculate points correctly for wins, losses, and pushes", async () => {
      picksQueryService.findUnassessedPicksForLeague.mockResolvedValue([]);

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // User has 10 wins, 5 losses, 2 pushes
      picksQueryService.findByUserIdAndLeagueId.mockResolvedValue([
        ...Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `pick-win-${i}`,
            userId: userId1,
            leagueId,
            seasonId,
            eventId: `event-win-${i}`,
            teamId: `team-${i}`,
            spread: null,
            result: PICK_RESULTS.WIN,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        ...Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `pick-loss-${i}`,
            userId: userId1,
            leagueId,
            seasonId,
            eventId: `event-loss-${i}`,
            teamId: `team-${i}`,
            spread: null,
            result: PICK_RESULTS.LOSS,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        ...Array(2)
          .fill(null)
          .map((_, i) => ({
            id: `pick-push-${i}`,
            userId: userId1,
            leagueId,
            seasonId,
            eventId: `event-push-${i}`,
            teamId: `team-${i}`,
            spread: null,
            result: PICK_RESULTS.PUSH,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
      ]);

      standingsQueryService.findByUserLeagueSeason.mockResolvedValue({
        userId: userId1,
        leagueId,
        seasonId,
        points: 999, // Wrong value - should be recalculated
        rank: 1,
        metadata: { wins: 999, losses: 999, pushes: 999 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      standingsQueryService.findByLeagueSeason.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          seasonId,
          points: 11, // Will be recalculated
          rank: 1,
          metadata: { wins: 10, losses: 5, pushes: 2 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await standingsService.calculateStandingsForLeagues([leagueId]);

      // Should calculate: 10 wins + (2 pushes * 0.5) = 11 points
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        userId1,
        leagueId,
        seasonId,
        expect.objectContaining({
          points: 11,
          metadata: { wins: 10, losses: 5, pushes: 2 },
        }),
        undefined,
      );
    });

    it("should calculate pick result correctly for spread picks", async () => {
      // Unassessed pick with spread: home team favored by 3.5
      const unassessedPicks: UnassessedPick[] = [
        {
          id: "pick-1",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-1",
          teamId: "team-home",
          spread: -3.5,
          outcome: { homeScore: 24, awayScore: 21 }, // Home wins by 3 (doesn't cover)
          event: { homeTeamId: "team-home", awayTeamId: "team-away" },
        },
      ];

      picksQueryService.findUnassessedPicksForLeague.mockResolvedValue(
        unassessedPicks,
      );

      standingsQueryService.findByUserLeagueSeason.mockResolvedValue({
        userId: userId1,
        leagueId,
        seasonId,
        points: 0,
        rank: 1,
        metadata: { wins: 0, losses: 0, pushes: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      picksQueryService.findByUserIdAndLeagueId.mockResolvedValue([
        {
          id: "pick-1",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-1",
          teamId: "team-home",
          spread: -3.5,
          result: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      standingsQueryService.findByLeagueSeason.mockResolvedValue([]);

      await standingsService.calculateStandingsForLeagues([leagueId]);

      // Home team with -3.5 spread: 24 + (-3.5) = 20.5 < 21 = LOSS
      expect(picksMutationService.update).toHaveBeenCalledWith(
        "pick-1",
        { result: PICK_RESULTS.LOSS },
        undefined,
      );
    });

    it("should calculate push correctly when scores match spread exactly", async () => {
      const unassessedPicks: UnassessedPick[] = [
        {
          id: "pick-1",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-1",
          teamId: "team-home",
          spread: -3,
          outcome: { homeScore: 24, awayScore: 21 }, // Home wins by exactly 3 (push)
          event: { homeTeamId: "team-home", awayTeamId: "team-away" },
        },
      ];

      picksQueryService.findUnassessedPicksForLeague.mockResolvedValue(
        unassessedPicks,
      );

      standingsQueryService.findByUserLeagueSeason.mockResolvedValue({
        userId: userId1,
        leagueId,
        seasonId,
        points: 0,
        rank: 1,
        metadata: { wins: 0, losses: 0, pushes: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      picksQueryService.findByUserIdAndLeagueId.mockResolvedValue([
        {
          id: "pick-1",
          userId: userId1,
          leagueId,
          seasonId,
          eventId: "event-1",
          teamId: "team-home",
          spread: -3,
          result: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      standingsQueryService.findByLeagueSeason.mockResolvedValue([]);

      await standingsService.calculateStandingsForLeagues([leagueId]);

      // Home team with -3 spread: 24 + (-3) = 21 = 21 = PUSH
      expect(picksMutationService.update).toHaveBeenCalledWith(
        "pick-1",
        { result: PICK_RESULTS.PUSH },
        undefined,
      );
    });

    it("should update ranks correctly based on points", async () => {
      picksQueryService.findUnassessedPicksForLeague.mockResolvedValue([]);

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: userId2,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // User 1 has 10 points, User 2 has 5 points
      picksQueryService.findByUserIdAndLeagueId
        .mockResolvedValueOnce(
          Array(10)
            .fill(null)
            .map((_, i) => ({
              id: `pick-${i}`,
              userId: userId1,
              leagueId,
              seasonId,
              eventId: `event-${i}`,
              teamId: `team-${i}`,
              spread: null,
              result: PICK_RESULTS.WIN,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
        )
        .mockResolvedValueOnce(
          Array(5)
            .fill(null)
            .map((_, i) => ({
              id: `pick-${i}`,
              userId: userId2,
              leagueId,
              seasonId,
              eventId: `event-${i}`,
              teamId: `team-${i}`,
              spread: null,
              result: PICK_RESULTS.WIN,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
        );

      standingsQueryService.findByUserLeagueSeason
        .mockResolvedValueOnce({
          userId: userId1,
          leagueId,
          seasonId,
          points: 10,
          rank: 1,
          metadata: { wins: 10, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          userId: userId2,
          leagueId,
          seasonId,
          points: 5,
          rank: 2,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      standingsQueryService.findByLeagueSeason.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          seasonId,
          points: 10,
          rank: 99, // Wrong rank - should be updated
          metadata: { wins: 10, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: userId2,
          leagueId,
          seasonId,
          points: 5,
          rank: 99, // Wrong rank - should be updated
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await standingsService.calculateStandingsForLeagues([leagueId]);

      // Should update user-1 to rank 1
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        userId1,
        leagueId,
        seasonId,
        expect.objectContaining({ rank: 1 }),
        undefined,
      );

      // Should update user-2 to rank 2
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        userId2,
        leagueId,
        seasonId,
        expect.objectContaining({ rank: 2 }),
        undefined,
      );
    });

    it("should handle tied ranks correctly", async () => {
      picksQueryService.findUnassessedPicksForLeague.mockResolvedValue([]);

      leaguesQueryService.findById.mockResolvedValue({
        id: leagueId,
        name: "Test League",
        leagueTypeId,
        image: null,
        startPhaseTemplateId: "template-1",
        endPhaseTemplateId: "template-2",
        visibility: LEAGUE_VISIBILITIES.PRIVATE,
        size: 10,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      leagueTypesQueryService.findById.mockResolvedValue({
        id: leagueTypeId,
        name: LEAGUE_TYPE_NAMES.PICK_EM,
        slug: LEAGUE_TYPE_SLUGS.PICK_EM,
        description: null,
        sportLeagueId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
        {
          id: seasonId,
          name: "Test Season",
          sportLeagueId,
          year: "2024",
          startDate: new Date(),
          endDate: new Date(),
        },
      );

      const user3 = "user-3";
      leagueMembersQueryService.listByLeagueId.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: userId2,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: user3,
          leagueId,
          role: LEAGUE_MEMBER_ROLES.MEMBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // All users have 5 points (tied)
      const mockPicks = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `pick-${i}`,
          userId: "",
          leagueId,
          seasonId,
          eventId: `event-${i}`,
          teamId: `team-${i}`,
          spread: null,
          result: PICK_RESULTS.WIN,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

      picksQueryService.findByUserIdAndLeagueId
        .mockResolvedValueOnce(
          mockPicks.map((p) => ({ ...p, userId: userId1 })),
        )
        .mockResolvedValueOnce(
          mockPicks.map((p) => ({ ...p, userId: userId2 })),
        )
        .mockResolvedValueOnce(mockPicks.map((p) => ({ ...p, userId: user3 })));

      standingsQueryService.findByUserLeagueSeason
        .mockResolvedValueOnce({
          userId: userId1,
          leagueId,
          seasonId,
          points: 5,
          rank: 1,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          userId: userId2,
          leagueId,
          seasonId,
          points: 5,
          rank: 1,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          userId: user3,
          leagueId,
          seasonId,
          points: 5,
          rank: 1,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      standingsQueryService.findByLeagueSeason.mockResolvedValue([
        {
          userId: userId1,
          leagueId,
          seasonId,
          points: 5,
          rank: 1,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: userId2,
          leagueId,
          seasonId,
          points: 5,
          rank: 1,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: user3,
          leagueId,
          seasonId,
          points: 5,
          rank: 1,
          metadata: { wins: 5, losses: 0, pushes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await standingsService.calculateStandingsForLeagues([leagueId]);

      // All three users should have rank 1 (tied)
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        userId1,
        leagueId,
        seasonId,
        expect.objectContaining({ rank: 1 }),
        undefined,
      );
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        userId2,
        leagueId,
        seasonId,
        expect.objectContaining({ rank: 1 }),
        undefined,
      );
      expect(standingsMutationService.update).toHaveBeenCalledWith(
        user3,
        leagueId,
        seasonId,
        expect.objectContaining({ rank: 1 }),
        undefined,
      );
    });
  });
});
