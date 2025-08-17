import { describe, it, expect, beforeEach } from "vitest";
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
});
