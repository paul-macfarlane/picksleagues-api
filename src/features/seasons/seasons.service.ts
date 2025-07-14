import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db } from "../../db";
import { PhasesService } from "../phases/phases.service";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { EspnService } from "../../integrations/espn/espn.service";
import {
  ESPN_DESIRED_LEAGUES,
  ESPN_SEASON_TYPES,
} from "../../integrations/espn/espn.types";
import { SeasonsQueryService } from "./seasons.query.service";
import { SeasonsMutationService } from "./seasons.mutation.service";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service";
import { NotFoundError } from "../../lib/errors";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service";

@injectable()
export class SeasonsService {
  constructor(
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    // todo this can be refactored so that phases are their own cron, that way the seasons service doens't need to use the phases service
    @inject(TYPES.PhasesService)
    private phasesService: PhasesService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
    @inject(TYPES.SeasonsMutationService)
    private seasonsMutationService: SeasonsMutationService,
  ) {}

  async syncSeasons() {
    return db.transaction(async (tx) => {
      const dataSource = await this.dataSourcesQueryService.findByName(
        DATA_SOURCE_NAMES.ESPN,
      );
      if (!dataSource) {
        throw new NotFoundError("ESPN data source not found");
      }

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
        const espnLeagueSeasons = await this.espnService.getESPNLeagueSeasons(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );

        let sportLeagueId: string | undefined;
        let seasonId: string | undefined;

        for (const externalSeason of espnLeagueSeasons) {
          const existingExternalSeason =
            await this.seasonsQueryService.findExternalBySourceAndId(
              dataSource.id,
              externalSeason.displayName,
              tx,
            );
          if (existingExternalSeason) {
            const updatedSeason = await this.seasonsMutationService.update(
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

            await this.seasonsMutationService.updateExternal(
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
              await this.sportLeaguesQueryService.findExternalBySourceAndMetadata(
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

            const insertedSeason = await this.seasonsMutationService.create(
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

            await this.seasonsMutationService.createExternal(
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
            const regularSeasonESPNWeeks = await this.espnService.getESPNWeeks(
              desiredLeague.sportSlug,
              desiredLeague.leagueSlug,
              externalSeason.displayName,
              ESPN_SEASON_TYPES.REGULAR_SEASON,
            );

            const postSeasonESPNWeeks = await this.espnService.getESPNWeeks(
              desiredLeague.sportSlug,
              desiredLeague.leagueSlug,
              externalSeason.displayName,
              ESPN_SEASON_TYPES.POST_SEASON,
            );

            const allESPNWeeks = [
              ...regularSeasonESPNWeeks,
              ...postSeasonESPNWeeks.filter((week) => week.text !== "Pro Bowl"),
            ];

            // todo this can be refactored so that phases are their own cron, that way the seasons service doens't need to use the phases service
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
