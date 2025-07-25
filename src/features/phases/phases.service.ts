import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { db } from "../../db/index.js";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types.js";
import { ESPN_SEASON_TYPES } from "../../integrations/espn/espn.types.js";
import { PhasesQueryService } from "./phases.query.service.js";
import { PhasesMutationService } from "./phases.mutation.service.js";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";
import { NotFoundError } from "../../lib/errors.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { EspnExternalSeasonMetadataSchema } from "../seasons/seasons.types.js";

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
    @inject(TYPES.SeasonsUtilService)
    private seasonsUtilService: SeasonsUtilService,
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

        const season =
          await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
            sportLeague.id,
            tx,
          );
        if (!season) {
          console.error(`Latest season not found for ${sportLeague.id}`);
          continue;
        }

        const externalSeason =
          await this.seasonsQueryService.findExternalBySourceAndSeasonId(
            dataSource.id,
            season.id,
            tx,
          );
        if (!externalSeason) {
          console.error(`External season not found for ${season.id}`);
          continue;
        }

        const parsedExternalSeasonMetadata =
          EspnExternalSeasonMetadataSchema.safeParse(externalSeason.metadata);
        if (!parsedExternalSeasonMetadata.success) {
          console.error(
            `Invalid metadata for ${season.id}: ${parsedExternalSeasonMetadata.error}`,
          );
          continue;
        }

        const regularSeasonESPNWeeks = await this.espnService.getESPNWeeks(
          parsedExternalSportLeagueMetadata.data.sportSlug,
          parsedExternalSportLeagueMetadata.data.leagueSlug,
          parsedExternalSeasonMetadata.data.slug,
          ESPN_SEASON_TYPES.REGULAR_SEASON,
        );

        const postSeasonESPNWeeks = await this.espnService.getESPNWeeks(
          parsedExternalSportLeagueMetadata.data.sportSlug,
          parsedExternalSportLeagueMetadata.data.leagueSlug,
          parsedExternalSeasonMetadata.data.slug,
          ESPN_SEASON_TYPES.POST_SEASON,
        );

        const espnWeeks = [
          ...regularSeasonESPNWeeks.map((week) => ({
            ...week,
            type: ESPN_SEASON_TYPES.REGULAR_SEASON,
          })),
          ...postSeasonESPNWeeks
            .filter((week) => week.text !== "Pro Bowl")
            .map((week) => ({
              ...week,
              type: ESPN_SEASON_TYPES.POST_SEASON,
            })),
        ];

        for (const [index, espnWeek] of espnWeeks.entries()) {
          const externalMetadata = {
            type: espnWeek.type,
            number: espnWeek.number,
          };

          const existingExternalPhase =
            await this.phasesQueryService.findExternalBySourceAndExternalId(
              dataSource.id,
              espnWeek.$ref,
              tx,
            );
          if (existingExternalPhase) {
            console.log(
              `${espnWeek.$ref} already exists for season ${externalSeason.seasonId}`,
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

            const updatedExternalPhase =
              await this.phasesMutationService.updateExternal(
                dataSource.id,
                existingExternalPhase.externalId,
                {
                  phaseId: updatedPhase.id,
                  metadata: externalMetadata,
                },
                tx,
              );

            console.log(
              `Updated external phase ${JSON.stringify(updatedExternalPhase)}`,
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
                  externalId: espnWeek.$ref, // the closest thing to a unique id
                  phaseId: insertedPhase.id,
                  metadata: externalMetadata,
                },
                tx,
              );

            console.log(
              `Inserted external phase ${JSON.stringify(insertedExternalPhase)}`,
            );
          }
        }
      }
    });
  }
}
