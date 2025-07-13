import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db, DBOrTx } from "../../db";
import { SportLeaguesRepository } from "./sportLeagues.repository";
import { DataSourcesService } from "../dataSources/dataSources.service";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { ESPN_DESIRED_LEAGUES } from "../../integrations/espn/espn.types";
import { DBSportLeague } from "./sportLeagues.types";
import { NotFoundError } from "../../lib/errors";
import { EspnService } from "../../integrations/espn/espn.service";

@injectable()
export class SportLeaguesService {
  constructor(
    @inject(TYPES.SportLeaguesRepository)
    private sportLeaguesRepository: SportLeaguesRepository,
    @inject(TYPES.DataSourcesService)
    private dataSourcesService: DataSourcesService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
  ) {}

  async findById(id: string): Promise<DBSportLeague | null> {
    return await this.sportLeaguesRepository.findById(id);
  }

  async findByName(
    name: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague | null> {
    return await this.sportLeaguesRepository.findByName(name, dbOrTx);
  }

  async getByName(name: string, dbOrTx: DBOrTx = db): Promise<DBSportLeague> {
    const sportLeague = await this.findByName(name, dbOrTx);
    if (!sportLeague) {
      throw new NotFoundError(`Sport league with name ${name} not found`);
    }
    return sportLeague;
  }

  async syncSportLeagues() {
    return await db.transaction(async (tx) => {
      const dataSource = await this.dataSourcesService.findByName(
        DATA_SOURCE_NAMES.ESPN,
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

        const existingExternalLeague =
          await this.sportLeaguesRepository.findExternalBySourceAndId(
            dataSource.id,
            espnLeague.id,
            tx,
          );
        if (existingExternalLeague) {
          console.log(
            `League ${desiredLeague.sportSlug}:${desiredLeague.leagueSlug} already exists, updating`,
          );

          await this.sportLeaguesRepository.updateExternal(
            dataSource.id,
            espnLeague.id,
            {
              metadata: {
                slug: espnLeague.slug,
              },
            },
            tx,
          );

          await this.sportLeaguesRepository.update(
            existingExternalLeague.sportLeagueId!,
            {
              name: espnLeague.displayName,
            },
            tx,
          );
        } else {
          console.log(
            `Creating new sport league with for sport ${desiredLeague.sportSlug} and league slug ${desiredLeague.leagueSlug} with name ${espnLeague.displayName}`,
          );

          const newSportLeague = await this.sportLeaguesRepository.create(
            {
              name: espnLeague.displayName,
            },
            tx,
          );

          await this.sportLeaguesRepository.createExternal(
            {
              dataSourceId: dataSource.id,
              externalId: espnLeague.id,
              sportLeagueId: newSportLeague.id,
              metadata: {
                slug: espnLeague.slug,
              },
            },
            tx,
          );
        }
      }
    });
  }
}
