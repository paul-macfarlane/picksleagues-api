import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { TeamsMutationService } from "./teams.mutation.service.js";
import { TeamsQueryService } from "./teams.query.service.js";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types.js";
import { NotFoundError } from "../../lib/errors.js";
import { db } from "../../db/index.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types.js";

@injectable()
export class TeamsService {
  constructor(
    @inject(TYPES.TeamsMutationService)
    private teamsMutationService: TeamsMutationService,
    @inject(TYPES.TeamsQueryService)
    private teamsQueryService: TeamsQueryService,
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
  ) {}

  async syncTeams(): Promise<void> {
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

        const latestSeason =
          await this.seasonsQueryService.findLatestBySportLeagueId(
            sportLeague.id,
            tx,
          );
        if (!latestSeason) {
          console.error(`Latest season not found for ${sportLeague.id}`);
          continue;
        }

        const latestExternalSeason =
          await this.seasonsQueryService.findExternalBySourceAndSeasonId(
            dataSource.id,
            latestSeason.id,
            tx,
          );
        if (!latestExternalSeason) {
          console.error(
            `Latest external season not found for ${latestSeason.id}`,
          );
          continue;
        }

        const espnTeams = await this.espnService.getESPNSportLeagueTeams(
          parsedExternalSportLeagueMetadata.data.sportSlug,
          parsedExternalSportLeagueMetadata.data.leagueSlug,
          latestExternalSeason.externalId,
        );

        for (const espnTeam of espnTeams) {
          const externalMetadata = {};

          const existingExternalTeam =
            await this.teamsQueryService.findExternalByDataSourceIdAndExternalId(
              dataSource.id,
              espnTeam.id,
              tx,
            );
          if (existingExternalTeam) {
            const updatedExternalTeam =
              await this.teamsMutationService.updateExternal(
                dataSource.id,
                espnTeam.id,
                {
                  metadata: externalMetadata,
                },
                tx,
              );
            console.log(
              `Updated external team ${JSON.stringify(updatedExternalTeam)}`,
            );

            const updatedTeam = await this.teamsMutationService.update(
              existingExternalTeam.teamId,
              {
                name: espnTeam.name,
                location: espnTeam.location,
                abbreviation: espnTeam.abbreviation,
                imageLight: espnTeam.logos[0]?.href,
                imageDark: espnTeam.logos[1]?.href,
              },
              tx,
            );

            console.log(`Updated team ${JSON.stringify(updatedTeam)}`);
          } else {
            const newTeam = await this.teamsMutationService.create(
              {
                name: espnTeam.name,
                location: espnTeam.location,
                abbreviation: espnTeam.abbreviation,
                sportLeagueId: externalSportLeague.sportLeagueId,
                imageLight: espnTeam.logos[0]?.href,
                imageDark: espnTeam.logos[1]?.href,
              },
              tx,
            );

            console.log(`Created team ${JSON.stringify(newTeam)}`);

            const insertedExternalTeam =
              await this.teamsMutationService.createExternal(
                {
                  dataSourceId: dataSource.id,
                  externalId: espnTeam.id,
                  teamId: newTeam.id,
                  metadata: externalMetadata,
                },
                tx,
              );

            console.log(
              `Created external team ${JSON.stringify(insertedExternalTeam)}`,
            );
          }
        }
      }
    });
  }
}
