import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { TeamsMutationService } from "./teams.mutation.service";
import { TeamsQueryService } from "./teams.query.service";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { NotFoundError } from "../../lib/errors";
import { db } from "../../db";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service";
import { ESPN_DESIRED_LEAGUES } from "../../integrations/espn/espn.types";
import { EspnService } from "../../integrations/espn/espn.service";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service";

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

      for (const desiredLeague of ESPN_DESIRED_LEAGUES) {
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
            `Sport league not found for ${desiredLeague.leagueSlug}`,
          );
          continue;
        }

        // only use the first season, we only need the latest season
        const [espnLeagueSeason] = await this.espnService.getESPNLeagueSeasons(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
        );

        const espnTeams = await this.espnService.getESPNSportLeagueTeams(
          desiredLeague.sportSlug,
          desiredLeague.leagueSlug,
          espnLeagueSeason.displayName,
        );

        for (const espnTeam of espnTeams) {
          const existingExternalTeam =
            await this.teamsQueryService.findExternalByDataSourceIdAndExternalId(
              dataSource.id,
              espnTeam.id,
              tx,
            );
          if (existingExternalTeam) {
            await this.teamsMutationService.updateExternal(
              dataSource.id,
              espnTeam.id,
              {
                metadata: {},
              },
              tx,
            );

            await this.teamsMutationService.update(
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

            await this.teamsMutationService.createExternal(
              {
                dataSourceId: dataSource.id,
                externalId: espnTeam.id,
                teamId: newTeam.id,
                metadata: {},
              },
              tx,
            );
          }
        }
      }
    });
  }
}
