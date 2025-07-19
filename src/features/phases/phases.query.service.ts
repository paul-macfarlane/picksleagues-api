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

  async findExternalBySourceAndId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalPhase | null> {
    return this.phasesRepository.findExternalBySourceAndId(
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
}
