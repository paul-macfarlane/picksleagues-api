import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { db } from "../../db";
import { DBDataSource } from "../dataSources/dataSources.types";
import { ESPNWeek } from "../../integrations/espn/espn.types";
import { PhasesQueryService } from "./phases.query.service";
import { PhasesMutationService } from "./phases.mutation.service";
import { PHASE_TEMPLATE_TYPES } from "../phaseTemplates/phaseTemplates.types";
import { PhaseTemplatesMutationService } from "../phaseTemplates/phaseTemplates.mutation.service";

@injectable()
export class PhasesService {
  constructor(
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.PhasesMutationService)
    private phasesMutationService: PhasesMutationService,
    @inject(TYPES.PhaseTemplatesMutationService)
    private phaseTemplatesMutationService: PhaseTemplatesMutationService,
  ) {}

  async syncPhases(
    sportLeagueId: string,
    seasonId: string,
    dataSource: DBDataSource,
    espnWeeks: ESPNWeek[],
  ) {
    return db.transaction(async (tx) => {
      for (const [index, espnWeek] of espnWeeks.entries()) {
        const existingExternalPhase =
          await this.phasesQueryService.findExternalBySourceAndId(
            dataSource.id,
            espnWeek.text,
            tx,
          );
        if (existingExternalPhase) {
          console.log(`${espnWeek.text} already exists for season ${seasonId}`);

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
          console.log(`${espnWeek.text} does not exist for season ${seasonId}`);

          const phaseTemplate = await this.phaseTemplatesMutationService.create(
            {
              sportLeagueId,
              label: espnWeek.text,
              sequence: index + 1,
              type: PHASE_TEMPLATE_TYPES.WEEK,
            },
            tx,
          );

          const insertedPhase = await this.phasesMutationService.create(
            {
              seasonId,
              phaseTemplateId: phaseTemplate.id,
              sequence: index + 1,
              startDate: new Date(espnWeek.startDate),
              endDate: new Date(espnWeek.endDate),
            },
            tx,
          );

          await this.phasesMutationService.createExternal(
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
