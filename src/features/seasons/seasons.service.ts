import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db } from "../../db";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { EspnService } from "../../integrations/espn/espn.service";
import { ESPN_DESIRED_LEAGUES } from "../../integrations/espn/espn.types";
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
        tx,
      );
      if (!dataSource) {
        throw new NotFoundError("ESPN data source not found");
      }

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
        const espnLeagueSeasons = await this.espnService.getESPNLeagueSeasons(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );

        for (const espnLeagueSeason of espnLeagueSeasons) {
          const existingExternalSeason =
            await this.seasonsQueryService.findExternalBySourceAndId(
              dataSource.id,
              espnLeagueSeason.displayName,
              tx,
            );
          if (existingExternalSeason) {
            const updatedSeason = await this.seasonsMutationService.update(
              existingExternalSeason.seasonId,
              {
                name: espnLeagueSeason.displayName,
                year: espnLeagueSeason.year.toString(),
                startDate: new Date(espnLeagueSeason.startDate),
                endDate: new Date(espnLeagueSeason.endDate),
              },
              tx,
            );

            console.log(`Updated season ${JSON.stringify(updatedSeason)}`);

            const updatedExternalSeason =
              await this.seasonsMutationService.updateExternal(
                dataSource.id,
                espnLeagueSeason.displayName,
                {
                  seasonId: existingExternalSeason.seasonId,
                  metadata: {
                    slug: espnLeagueSeason.displayName,
                  },
                },
                tx,
              );

            console.log(
              `Updated external season ${JSON.stringify(updatedExternalSeason)}`,
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

            console.log(`Inserting season ${espnLeagueSeason.displayName}`);

            const insertedSeason = await this.seasonsMutationService.create(
              {
                name: espnLeagueSeason.displayName,
                year: espnLeagueSeason.year.toString(),
                startDate: new Date(espnLeagueSeason.startDate),
                endDate: new Date(espnLeagueSeason.endDate),
                sportLeagueId: externalSportLeague.sportLeagueId,
              },
              tx,
            );

            console.log(`Inserted season ${JSON.stringify(insertedSeason)}`);

            const insertedExternalSeason =
              await this.seasonsMutationService.createExternal(
                {
                  dataSourceId: dataSource.id,
                  externalId: espnLeagueSeason.displayName,
                  seasonId: insertedSeason.id,
                  metadata: {
                    slug: espnLeagueSeason.displayName,
                  },
                },
                tx,
              );

            console.log(
              `Inserted external season ${JSON.stringify(insertedExternalSeason)}`,
            );
          }
        }
      }
    });
  }
}
