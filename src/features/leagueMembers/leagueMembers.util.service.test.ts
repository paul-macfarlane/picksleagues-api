import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { LeagueMembersUtilService } from "./leagueMembers.util.service.js";
import { LeagueMembersMutationService } from "./leagueMembers.mutation.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { StandingsMutationService } from "../standings/standings.mutation.service.js";
import { DBLeague, LEAGUE_VISIBILITIES } from "../leagues/leagues.types.js";
import {
  DBLeagueType,
  LEAGUE_TYPE_NAMES,
  LEAGUE_TYPE_SLUGS,
} from "../leagueTypes/leagueTypes.types.js";
import { DBSeason } from "../seasons/seasons.types.js";
import { LEAGUE_MEMBER_ROLES } from "./leagueMembers.types.js";
import { NotFoundError } from "../../lib/errors.js";

describe("LeagueMembersUtilService", () => {
  let service: LeagueMembersUtilService;
  let leagueMembersMutationService: MockProxy<LeagueMembersMutationService>;
  let leaguesQueryService: MockProxy<LeaguesQueryService>;
  let leagueTypesQueryService: MockProxy<LeagueTypesQueryService>;
  let seasonsUtilService: MockProxy<SeasonsUtilService>;
  let standingsMutationService: MockProxy<StandingsMutationService>;

  beforeEach(() => {
    leagueMembersMutationService = mock<LeagueMembersMutationService>();
    leaguesQueryService = mock<LeaguesQueryService>();
    leagueTypesQueryService = mock<LeagueTypesQueryService>();
    seasonsUtilService = mock<SeasonsUtilService>();
    standingsMutationService = mock<StandingsMutationService>();

    service = new LeagueMembersUtilService(
      leagueMembersMutationService,
      leaguesQueryService,
      leagueTypesQueryService,
      seasonsUtilService,
      standingsMutationService,
    );
  });

  it("adds member and initializes standings (happy path)", async () => {
    const leagueId = "league-1";
    const userId = "user-1";
    const role = LEAGUE_MEMBER_ROLES.MEMBER;
    const league: DBLeague = {
      id: leagueId,
      name: "Test League",
      image: null,
      leagueTypeId: "lt-1",
      startPhaseTemplateId: "pt-start",
      endPhaseTemplateId: "pt-end",
      visibility: LEAGUE_VISIBILITIES.PRIVATE,
      size: 10,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const leagueType: DBLeagueType = {
      id: "lt-1",
      name: LEAGUE_TYPE_NAMES.PICK_EM,
      slug: LEAGUE_TYPE_SLUGS.PICK_EM,
      description: "",
      sportLeagueId: "sport-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const season: DBSeason = {
      id: "season-1",
      name: "2024",
      sportLeagueId: "sport-1",
      year: "2024",
      startDate: new Date(),
      endDate: new Date(),
    };

    leaguesQueryService.findById.mockResolvedValue(league);
    leagueTypesQueryService.findById.mockResolvedValue(leagueType);
    seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
      season,
    );

    await service.addMemberAndInitializeStandings(leagueId, userId, role);

    expect(
      leagueMembersMutationService.createLeagueMember,
    ).toHaveBeenCalledWith({ leagueId, userId, role }, undefined);
    expect(standingsMutationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ leagueId, userId, seasonId: season.id }),
      undefined,
    );
  });

  it("throws NotFoundError when league not found", async () => {
    leaguesQueryService.findById.mockResolvedValue(null);
    await expect(
      service.addMemberAndInitializeStandings(
        "missing-league",
        "user",
        LEAGUE_MEMBER_ROLES.MEMBER,
      ),
    ).rejects.toThrow(new NotFoundError("League not found"));
  });

  it("throws NotFoundError when league type not found", async () => {
    leaguesQueryService.findById.mockResolvedValue({
      id: "l",
      leagueTypeId: "lt",
    } as DBLeague);
    leagueTypesQueryService.findById.mockResolvedValue(null);

    await expect(
      service.addMemberAndInitializeStandings(
        "l",
        "u",
        LEAGUE_MEMBER_ROLES.MEMBER,
      ),
    ).rejects.toThrow(new NotFoundError("League type not found"));
  });

  it("throws NotFoundError when season not found", async () => {
    leaguesQueryService.findById.mockResolvedValue({
      id: "l",
      leagueTypeId: "lt",
    } as DBLeague);
    leagueTypesQueryService.findById.mockResolvedValue({
      id: "lt",
      sportLeagueId: "sport-1",
    } as DBLeagueType);
    seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId.mockResolvedValue(
      null,
    );

    await expect(
      service.addMemberAndInitializeStandings(
        "l",
        "u",
        LEAGUE_MEMBER_ROLES.MEMBER,
      ),
    ).rejects.toThrow(
      new NotFoundError(
        "Season not found to create standings record for new member",
      ),
    );
  });
});
