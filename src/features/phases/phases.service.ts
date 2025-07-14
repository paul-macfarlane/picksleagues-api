import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db } from "../../db";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import {
  ESPN_DESIRED_LEAGUES,
  ESPN_SEASON_TYPES,
} from "../../integrations/espn/espn.types";
import { PhasesQueryService } from "./phases.query.service";
import { PhasesMutationService } from "./phases.mutation.service";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service";
import { EspnService } from "../../integrations/espn/espn.service";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service";
import { NotFoundError } from "../../lib/errors";
import { SeasonsQueryService } from "../seasons/seasons.query.service";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service";

@injectable()
export class PhasesService {
  constructor(
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.PhasesMutationService)
    private phasesMutationService: PhasesMutationService,
    @inject(TYPES.PhaseTemplatesQueryService)
    private phaseTemplatesQueryService: PhaseTemplatesQueryService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
  ) {}

  async syncPhases() {
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
          const externalSeason =
            await this.seasonsQueryService.findExternalBySourceAndId(
              dataSource.id,
              espnLeagueSeason.displayName,
              tx,
            );
          if (!externalSeason) {
            console.warn(
              `Season ${espnLeagueSeason.displayName} not found for ${dataSource.name}`,
            );
            continue;
          }

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

          const regularSeasonESPNWeeks = await this.espnService.getESPNWeeks(
            desiredLeague.sportSlug,
            desiredLeague.leagueSlug,
            espnLeagueSeason.displayName,
            ESPN_SEASON_TYPES.REGULAR_SEASON,
          );

          const postSeasonESPNWeeks = await this.espnService.getESPNWeeks(
            desiredLeague.sportSlug,
            desiredLeague.leagueSlug,
            espnLeagueSeason.displayName,
            ESPN_SEASON_TYPES.POST_SEASON,
          );

          const espnWeeks = [
            ...regularSeasonESPNWeeks,
            ...postSeasonESPNWeeks.filter((week) => week.text !== "Pro Bowl"),
          ];

          for (const [index, espnWeek] of espnWeeks.entries()) {
            const existingExternalPhase =
              await this.phasesQueryService.findExternalBySourceAndId(
                dataSource.id,
                espnWeek.text,
                tx,
              );
            if (existingExternalPhase) {
              console.log(
                `${espnWeek.text} already exists for season ${externalSeason.seasonId}`,
              );

              const updatedPhase = await this.phasesMutationService.update(
                existingExternalPhase.phaseId,
                {
                  sequence: index + 1,
                  startDate: new Date(espnWeek.startDate),
                  endDate: new Date(espnWeek.endDate),
                },
                tx,
              );

              console.log(`Updated phase ${JSON.stringify(updatedPhase)}`);

              await this.phasesMutationService.updateExternal(
                dataSource.id,
                existingExternalPhase.externalId,
                {
                  phaseId: updatedPhase.id,
                },
                tx,
              );
            } else {
              console.log(
                `${espnWeek.text} does not exist for season ${externalSeason.seasonId}`,
              );

              const phaseTemplate =
                await this.phaseTemplatesQueryService.findBySportLeagueAndLabel(
                  externalSportLeague.sportLeagueId,
                  espnWeek.text,
                  tx,
                );
              if (!phaseTemplate) {
                console.warn(`Phase template not found for ${espnWeek.text}`);
                continue;
              }

              const insertedPhase = await this.phasesMutationService.create(
                {
                  seasonId: externalSeason.seasonId,
                  phaseTemplateId: phaseTemplate.id,
                  sequence: index + 1,
                  startDate: new Date(espnWeek.startDate),
                  endDate: new Date(espnWeek.endDate),
                },
                tx,
              );

              console.log(`Inserting phase ${JSON.stringify(insertedPhase)}`);

              const insertedExternalPhase =
                await this.phasesMutationService.createExternal(
                  {
                    dataSourceId: dataSource.id,
                    externalId: espnWeek.text,
                    phaseId: insertedPhase.id,
                  },
                  tx,
                );

              console.log(
                `Inserted external phase ${JSON.stringify(insertedExternalPhase)}`,
              );
            }
          }
        }
      }
    });
  }
}
