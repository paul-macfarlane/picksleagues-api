import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { PhasesRepository } from "./phases.repository";
import { DBExternalPhase, DBPhase } from "./phases.types";

@injectable()
export class PhasesQueryService {
  constructor(
    @inject(TYPES.PhasesRepository)
    private phasesRepository: PhasesRepository,
  ) {}

  async findExternalBySourceAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalPhase | null> {
    return this.phasesRepository.findExternalBySourceAndExternalId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }

  async findCurrentPhases(
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    currentDate: Date,
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase[]> {
    return this.phasesRepository.findCurrentPhases(
      startPhaseTemplateId,
      endPhaseTemplateId,
      currentDate,
      dbOrTx,
    );
  }

  async listBySeasonId(seasonId: string, dbOrTx?: DBOrTx): Promise<DBPhase[]> {
    return this.phasesRepository.listBySeasonId(seasonId, dbOrTx);
  }

  async listExternalByPhaseIds(
    phaseIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalPhase[]> {
    return this.phasesRepository.listExternalByPhaseIds(phaseIds, dbOrTx);
  }
}
