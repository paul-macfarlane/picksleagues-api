import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db } from "../../db";
import { SeasonsRepository } from "./seasons.repository";
import { DataSourcesService } from "../dataSources/dataSources.service";
import { PhasesService } from "../phases/phases.service";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { ESPN_DESIRED_LEAGUES } from "../../lib/external/espn/models/leagues/constants";
import { getESPNLeagueSeasons } from "../../lib/external/espn/api/seasons";
import { getESPNWeeks } from "../../lib/external/espn/api/weeks";
import { ESPN_SEASON_TYPES } from "../../lib/external/espn/models/seasons/constants";
import { SportLeaguesRepository } from "../sportLeagues/sportLeagues.repository";

@injectable()
export class SeasonsService {
  constructor(
    @inject(TYPES.SeasonsRepository)
    private seasonsRepository: SeasonsRepository,
    @inject(TYPES.DataSourcesService)
    private dataSourcesService: DataSourcesService,
    @inject(TYPES.PhasesService)
    private phasesService: PhasesService,
    @inject(TYPES.SportLeaguesRepository)
    private sportLeaguesRepository: SportLeaguesRepository,
  ) {}

  async syncSeasons() {
    return await db.transaction(async (tx) => {
      const dataSource = await this.dataSourcesService.getByName(
        DATA_SOURCE_NAMES.ESPN,
      );

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
        const espnLeagueSeasons = await getESPNLeagueSeasons(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );

        let sportLeagueId: string | undefined;
        let seasonId: string | undefined;

        for (const externalSeason of espnLeagueSeasons) {
          const existingExternalSeason =
            await this.seasonsRepository.findExternalBySourceAndId(
              dataSource.id,
              externalSeason.displayName,
              tx,
            );
          if (existingExternalSeason) {
            const updatedSeason = await this.seasonsRepository.update(
              existingExternalSeason.seasonId,
              {
                name: externalSeason.displayName,
                year: externalSeason.year.toString(),
                startDate: new Date(externalSeason.startDate),
                endDate: new Date(externalSeason.endDate),
              },
              tx,
            );

            sportLeagueId = updatedSeason.sportLeagueId;
            seasonId = updatedSeason.id;

            await this.seasonsRepository.updateExternal(
              dataSource.id,
              externalSeason.displayName,
              {
                seasonId: existingExternalSeason.seasonId,
                metadata: {
                  slug: externalSeason.displayName,
                },
              },
              tx,
            );
          } else {
            const externalSportLeague =
              await this.sportLeaguesRepository.findExternalBySourceAndMetadata(
                dataSource.id,
                {
                  slug: desiredLeague.leagueSlug,
                },
                tx,
              );
            if (!externalSportLeague) {
              console.error(
                `Sport league not found for ${desiredLeague.sportSlug} ${desiredLeague.leagueSlug}`,
              );
              continue;
            }

            const insertedSeason = await this.seasonsRepository.create(
              {
                name: externalSeason.displayName,
                year: externalSeason.year.toString(),
                startDate: new Date(externalSeason.startDate),
                endDate: new Date(externalSeason.endDate),
                sportLeagueId: externalSportLeague.sportLeagueId,
              },
              tx,
            );

            sportLeagueId = insertedSeason.sportLeagueId;
            seasonId = insertedSeason.id;

            await this.seasonsRepository.createExternal(
              {
                dataSourceId: dataSource.id,
                externalId: externalSeason.displayName,
                seasonId: insertedSeason.id,
                metadata: {
                  slug: externalSeason.displayName,
                },
              },
              tx,
            );
          }

          if (sportLeagueId && seasonId) {
            const regularSeasonESPNWeeks = await getESPNWeeks(
              desiredLeague.sportSlug,
              desiredLeague.leagueSlug,
              externalSeason.displayName,
              ESPN_SEASON_TYPES.REGULAR_SEASON,
            );

            const postSeasonESPNWeeks = await getESPNWeeks(
              desiredLeague.sportSlug,
              desiredLeague.leagueSlug,
              externalSeason.displayName,
              ESPN_SEASON_TYPES.POST_SEASON,
            );

            const allESPNWeeks = [
              ...regularSeasonESPNWeeks,
              ...postSeasonESPNWeeks.filter((week) => week.text !== "Pro Bowl"),
            ];

            await this.phasesService.syncPhases(
              sportLeagueId,
              seasonId,
              dataSource,
              allESPNWeeks,
            );
          }
        }
      }
    });
  }
}
