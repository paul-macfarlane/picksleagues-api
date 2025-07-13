import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db } from "../../db";
import { PhasesRepository } from "./phases.repository";
import { PhaseTemplatesService } from "../phaseTemplates/phaseTemplates.service";
import { DBDataSource } from "../dataSources/dataSources.types";
import { ESPNWeek } from "../../integrations/espn/espn.types";

@injectable()
export class PhasesService {
  constructor(
    @inject(TYPES.PhasesRepository)
    private phasesRepository: PhasesRepository,
    @inject(TYPES.PhaseTemplatesService)
    private phaseTemplatesService: PhaseTemplatesService,
  ) {}

  async syncPhases(
    sportLeagueId: string,
    seasonId: string,
    dataSource: DBDataSource,
    espnWeeks: ESPNWeek[],
  ) {
    return await db.transaction(async (tx) => {
      for (const [index, espnWeek] of espnWeeks.entries()) {
        const existingExternalPhase =
          await this.phasesRepository.findExternalBySourceAndId(
            dataSource.id,
            espnWeek.text,
            tx,
          );
        if (existingExternalPhase) {
          console.log(`${espnWeek.text} already exists for season ${seasonId}`);

          const updatedPhase = await this.phasesRepository.update(
            existingExternalPhase.phaseId,
            {
              sequence: index + 1,
              startDate: new Date(espnWeek.startDate),
              endDate: new Date(espnWeek.endDate),
            },
            tx,
          );

          console.log(`Updated phase ${JSON.stringify(updatedPhase)}`);

          await this.phasesRepository.updateExternal(
            dataSource.id,
            existingExternalPhase.externalId,
            {
              phaseId: updatedPhase.id,
            },
            tx,
          );
        } else {
          console.log(`${espnWeek.text} does not exist for season ${seasonId}`);

          const phaseTemplate =
            await this.phaseTemplatesService.findBySportLeagueAndLabel(
              sportLeagueId,
              espnWeek.text,
              tx,
            );
          if (!phaseTemplate) {
            console.error(`Phase template not found for ${espnWeek.text}`);
            continue;
          }

          const insertedPhase = await this.phasesRepository.create(
            {
              seasonId,
              phaseTemplateId: phaseTemplate.id,
              sequence: index + 1,
              startDate: new Date(espnWeek.startDate),
              endDate: new Date(espnWeek.endDate),
            },
            tx,
          );

          await this.phasesRepository.createExternal(
            {
              dataSourceId: dataSource.id,
              externalId: espnWeek.text,
              phaseId: insertedPhase.id,
            },
            tx,
          );
        }
      }
    });
  }
}
