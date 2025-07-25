import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { db } from "../../db/index.js";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { SeasonsQueryService } from "./seasons.query.service.js";
import { SeasonsMutationService } from "./seasons.mutation.service.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";
import { NotFoundError } from "../../lib/errors.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types.js";

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

      const sportLeagues = await this.sportLeaguesQueryService.list(tx);
      console.log(`Found ${sportLeagues.length} sport leagues`);

      for (const sportLeague of sportLeagues) {
        const externalSportLeague =
          await this.sportLeaguesQueryService.findExternalBySourceAndSportLeagueId(
            dataSource.id,
            sportLeague.id,
            tx,
          );
        if (!externalSportLeague) {
          console.error(
            `External sport league not found for ${sportLeague.id}`,
          );
          continue;
        }

        const parsedExternalSportLeagueMetadata =
          EspnExternalSportLeagueMetadataSchema.safeParse(
            externalSportLeague.metadata,
          );
        if (!parsedExternalSportLeagueMetadata.success) {
          console.error(
            `Invalid metadata for ${sportLeague.id}: ${parsedExternalSportLeagueMetadata.error}`,
          );
          continue;
        }

        const espnLeagueSeasons = await this.espnService.getESPNLeagueSeasons(
          parsedExternalSportLeagueMetadata.data.sportSlug,
          parsedExternalSportLeagueMetadata.data.leagueSlug,
        );

        for (const espnLeagueSeason of espnLeagueSeasons) {
          const externalMetadata = {
            slug: espnLeagueSeason.displayName,
          };

          const existingExternalSeason =
            await this.seasonsQueryService.findExternalBySourceAndExternalId(
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
                  metadata: externalMetadata,
                },
                tx,
              );

            console.log(
              `Updated external season ${JSON.stringify(updatedExternalSeason)}`,
            );
          } else {
            console.log(`Inserting season ${espnLeagueSeason.displayName}`);

            const insertedSeason = await this.seasonsMutationService.create(
              {
                name: espnLeagueSeason.displayName,
                year: espnLeagueSeason.year.toString(),
                startDate: new Date(espnLeagueSeason.startDate),
                endDate: new Date(espnLeagueSeason.endDate),
                sportLeagueId: sportLeague.id,
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
                  metadata: externalMetadata,
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
