import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { TeamsService } from "./teams.service.js";
import { TeamsMutationService } from "./teams.mutation.service.js";
import { TeamsQueryService } from "./teams.query.service.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";

import { NotFoundError } from "../../lib/errors.js";
import {
  DATA_SOURCE_NAMES,
  DBDataSource,
} from "../dataSources/dataSources.types.js";
import {
  ESPN_LEAGUE_SLUGS,
  ESPN_SPORT_SLUGS,
  ESPNTeam,
} from "../../integrations/espn/espn.types.js";

// Mock the database transaction helper to execute synchronously
vi.mock("../../db/index.js", () => ({
  db: {
    transaction: vi.fn((callback: (tx?: unknown) => unknown) => callback()),
  },
}));

describe("TeamsService.syncTeams", () => {
  let service: TeamsService;

  let teamsMutationService: MockProxy<TeamsMutationService>;
  let teamsQueryService: MockProxy<TeamsQueryService>;
  let dataSourcesQueryService: MockProxy<DataSourcesQueryService>;
  let espnService: MockProxy<EspnService>;
  let sportLeaguesQueryService: MockProxy<SportLeaguesQueryService>;
  let seasonsQueryService: MockProxy<SeasonsQueryService>;

  beforeEach(() => {
    teamsMutationService = mock<TeamsMutationService>();
    teamsQueryService = mock<TeamsQueryService>();
    dataSourcesQueryService = mock<DataSourcesQueryService>();
    espnService = mock<EspnService>();
    sportLeaguesQueryService = mock<SportLeaguesQueryService>();
    seasonsQueryService = mock<SeasonsQueryService>();

    service = new TeamsService(
      teamsMutationService,
      teamsQueryService,
      dataSourcesQueryService,
      espnService,
      sportLeaguesQueryService,
      seasonsQueryService,
    );
  });

  it("throws when ESPN data source is missing", async () => {
    dataSourcesQueryService.findByName.mockResolvedValue(null);

    await expect(service.syncTeams()).rejects.toThrow(
      new NotFoundError("ESPN data source not found"),
    );
  });

  it("skips sport league when external mapping is missing", async () => {
    dataSourcesQueryService.findByName.mockResolvedValue({
      id: "ds1",
      name: DATA_SOURCE_NAMES.ESPN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sportLeaguesQueryService.list.mockResolvedValue([
      {
        id: "sl1",
        name: DATA_SOURCE_NAMES.ESPN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    sportLeaguesQueryService.findExternalBySourceAndSportLeagueId.mockResolvedValue(
      null,
    );

    await service.syncTeams();

    expect(espnService.getESPNSportLeagueTeams).not.toHaveBeenCalled();
  });

  it("skips sport league when external metadata is invalid", async () => {
    dataSourcesQueryService.findByName.mockResolvedValue({
      id: "ds1",
      name: DATA_SOURCE_NAMES.ESPN,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DBDataSource);
    sportLeaguesQueryService.list.mockResolvedValue([
      {
        id: "sl1",
        name: DATA_SOURCE_NAMES.ESPN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    sportLeaguesQueryService.findExternalBySourceAndSportLeagueId.mockResolvedValue(
      {
        sportLeagueId: "sl1",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        externalId: "sl1",
        dataSourceId: "ds1",
      },
    );

    await service.syncTeams();

    expect(espnService.getESPNSportLeagueTeams).not.toHaveBeenCalled();
  });

  it("skips sport league when latest season is missing", async () => {
    dataSourcesQueryService.findByName.mockResolvedValue({
      id: "ds1",
      name: DATA_SOURCE_NAMES.ESPN,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DBDataSource);
    sportLeaguesQueryService.list.mockResolvedValue([
      {
        id: "sl1",
        name: DATA_SOURCE_NAMES.ESPN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    sportLeaguesQueryService.findExternalBySourceAndSportLeagueId.mockResolvedValue(
      {
        sportLeagueId: "sl1",
        metadata: {
          sportSlug: ESPN_SPORT_SLUGS.FOOTBALL,
          leagueSlug: ESPN_LEAGUE_SLUGS.NFL,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        externalId: "sl1",
        dataSourceId: "ds1",
      },
    );
    seasonsQueryService.findLatestBySportLeagueId.mockResolvedValue(null);

    await service.syncTeams();

    expect(espnService.getESPNSportLeagueTeams).not.toHaveBeenCalled();
  });

  it("skips sport league when latest external season is missing", async () => {
    dataSourcesQueryService.findByName.mockResolvedValue({
      id: "ds1",
      name: DATA_SOURCE_NAMES.ESPN,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DBDataSource);
    sportLeaguesQueryService.list.mockResolvedValue([
      {
        id: "sl1",
        name: DATA_SOURCE_NAMES.ESPN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    sportLeaguesQueryService.findExternalBySourceAndSportLeagueId.mockResolvedValue(
      {
        sportLeagueId: "sl1",
        metadata: {
          sportSlug: ESPN_SPORT_SLUGS.FOOTBALL,
          leagueSlug: ESPN_LEAGUE_SLUGS.NFL,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        externalId: "sl1",
        dataSourceId: "ds1",
      },
    );
    seasonsQueryService.findLatestBySportLeagueId.mockResolvedValue({
      id: "season-1",
      sportLeagueId: "sl1",
      startDate: new Date(),
      endDate: new Date(),
      name: "2024",
      year: "2024",
    });
    seasonsQueryService.findExternalBySourceAndSeasonId.mockResolvedValue(null);

    await service.syncTeams();

    expect(espnService.getESPNSportLeagueTeams).not.toHaveBeenCalled();
  });

  it("updates existing external teams and creates new ones", async () => {
    // Arrange base data
    dataSourcesQueryService.findByName.mockResolvedValue({
      id: "ds1",
      name: DATA_SOURCE_NAMES.ESPN,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DBDataSource);
    sportLeaguesQueryService.list.mockResolvedValue([
      {
        id: "sl1",
        name: DATA_SOURCE_NAMES.ESPN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    sportLeaguesQueryService.findExternalBySourceAndSportLeagueId.mockResolvedValue(
      {
        sportLeagueId: "sl1",
        metadata: {
          sportSlug: ESPN_SPORT_SLUGS.FOOTBALL,
          leagueSlug: ESPN_LEAGUE_SLUGS.NFL,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        externalId: "sl1",
        dataSourceId: "ds1",
      },
    );
    seasonsQueryService.findLatestBySportLeagueId.mockResolvedValue({
      id: "season-1",
      sportLeagueId: "sl1",
      startDate: new Date(),
      endDate: new Date(),
      name: "2024",
      year: "2024",
    });
    seasonsQueryService.findExternalBySourceAndSeasonId.mockResolvedValue({
      externalId: "2024",
      createdAt: new Date(),
      updatedAt: new Date(),
      dataSourceId: "ds1",
      metadata: {},
      seasonId: "season-1",
    });

    const teamExisting = {
      id: "t1",
      name: "Existing Team",
      location: "City",
      abbreviation: "EXT",
      logos: [{ href: "light.png" }, { href: "dark.png" }],
    } as unknown as ESPNTeam;
    const teamNew = {
      id: "t2",
      name: "New Team",
      location: "Town",
      abbreviation: "NEW",
      logos: [{ href: "light2.png" }, { href: "dark2.png" }],
    } as unknown as ESPNTeam;
    espnService.getESPNSportLeagueTeams.mockResolvedValue([
      teamExisting,
      teamNew,
    ]);

    teamsQueryService.findExternalByDataSourceIdAndExternalId
      .mockResolvedValueOnce({
        teamId: "db-team-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        dataSourceId: "ds1",
        externalId: "t1",
        metadata: {},
      }) // existing for t1
      .mockResolvedValueOnce(null); // not existing for t2

    teamsMutationService.updateExternal.mockResolvedValue({
      createdAt: new Date(),
      updatedAt: new Date(),
      dataSourceId: "ds1",
      externalId: "t1",
      metadata: {},
      teamId: "db-team-1",
    });
    teamsMutationService.update.mockResolvedValue({
      id: "db-team-1",
      name: "Existing Team",
      location: "City",
      abbreviation: "EXT",
      imageLight: "light.png",
      imageDark: "dark.png",
      sportLeagueId: "sl1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    teamsMutationService.create.mockResolvedValue({
      id: "db-team-2",
      name: "New Team",
      location: "Town",
      abbreviation: "NEW",
      imageLight: "light2.png",
      imageDark: "dark2.png",
      sportLeagueId: "sl1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    teamsMutationService.createExternal.mockResolvedValue({
      createdAt: new Date(),
      updatedAt: new Date(),
      dataSourceId: "ds1",
      externalId: "t2",
      metadata: {},
      teamId: "db-team-2",
    });

    // Act
    await service.syncTeams();

    // Assert update flow for existing external team
    expect(teamsMutationService.updateExternal).toHaveBeenCalledWith(
      "ds1",
      "t1",
      { metadata: {} },
      undefined,
    );
    expect(teamsMutationService.update).toHaveBeenCalledWith(
      "db-team-1",
      {
        name: "Existing Team",
        location: "City",
        abbreviation: "EXT",
        imageLight: "light.png",
        imageDark: "dark.png",
      },
      undefined,
    );

    // Assert create flow for new team
    expect(teamsMutationService.create).toHaveBeenCalledWith(
      {
        name: "New Team",
        location: "Town",
        abbreviation: "NEW",
        sportLeagueId: "sl1",
        imageLight: "light2.png",
        imageDark: "dark2.png",
      },
      undefined,
    );
    expect(teamsMutationService.createExternal).toHaveBeenCalledWith(
      {
        dataSourceId: "ds1",
        externalId: "t2",
        teamId: "db-team-2",
        metadata: {},
      },
      undefined,
    );
  });
});
