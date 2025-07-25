import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { db } from "../../db/index.js";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types.js";
import { ESPN_DESIRED_LEAGUES } from "../../integrations/espn/espn.types.js";
import { NotFoundError } from "../../lib/errors.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { SportLeaguesQueryService } from "./sportLeagues.query.service.js";
import { SportLeaguesMutationService } from "./sportLeagues.mutation.service.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";

@injectable()
export class SportLeaguesService {
  constructor(
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
    @inject(TYPES.SportLeaguesMutationService)
    private sportLeaguesMutationService: SportLeaguesMutationService,
  ) {}

  async syncSportLeagues() {
    return db.transaction(async (tx) => {
      const dataSource = await this.dataSourcesQueryService.findByName(
        DATA_SOURCE_NAMES.ESPN,
        tx,
      );
      if (!dataSource) {
        throw new NotFoundError("ESPN data source not found");
      }

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
        const espnLeague = await this.espnService.getESPNLeague(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );

        console.log(
          `Processing league for sport ${desiredLeague.sportSlug} and league slug ${desiredLeague.leagueSlug} with external id ${espnLeague.id} from ${dataSource.name}`,
        );

        const externalMetadata = {
          sportSlug: desiredLeague.sportSlug,
          leagueSlug: espnLeague.slug,
        };

        const existingExternalLeague =
          await this.sportLeaguesQueryService.findExternalBySourceAndExternalId(
            dataSource.id,
            espnLeague.id,
            tx,
          );
        if (existingExternalLeague) {
          console.log(
            `League ${desiredLeague.sportSlug}:${desiredLeague.leagueSlug} already exists, updating`,
          );

          const updatedExternalLeague =
            await this.sportLeaguesMutationService.updateExternal(
              dataSource.id,
              espnLeague.id,
              {
                metadata: externalMetadata,
              },
              tx,
            );

          console.log(
            `Updated external league ${JSON.stringify(updatedExternalLeague)}`,
          );

          const updatedLeague = await this.sportLeaguesMutationService.update(
            existingExternalLeague.sportLeagueId!,
            {
              name: espnLeague.displayName,
            },
            tx,
          );

          console.log(`Updated league ${JSON.stringify(updatedLeague)}`);
        } else {
          console.log(
            `Creating new sport league with for sport ${desiredLeague.sportSlug} and league slug ${desiredLeague.leagueSlug} with name ${espnLeague.displayName}`,
          );

          const newSportLeague = await this.sportLeaguesMutationService.create(
            {
              name: espnLeague.displayName,
            },
            tx,
          );

          console.log(
            `Inserting new sport league ${JSON.stringify(newSportLeague)}`,
          );

          const insertedExternalLeague =
            await this.sportLeaguesMutationService.createExternal(
              {
                dataSourceId: dataSource.id,
                externalId: espnLeague.id,
                sportLeagueId: newSportLeague.id,
                metadata: externalMetadata,
              },
              tx,
            );

          console.log(
            `Inserted external league ${JSON.stringify(insertedExternalLeague)}`,
          );
        }
      }
    });
  }
}
