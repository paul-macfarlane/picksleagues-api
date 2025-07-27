import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PhasesRepository } from "./phases.repository.js";
import { DBExternalPhase, DBPhase } from "./phases.types.js";

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

  async listBySeasonIds(
    seasonIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase[]> {
    return this.phasesRepository.listBySeasonIds(seasonIds, dbOrTx);
  }

  async findCurrentBySeasonIds(
    seasonIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase[]> {
    return this.phasesRepository.findCurrentBySeasonIds(seasonIds, dbOrTx);
  }

  async findNextBySeasonIds(
    seasonIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase[]> {
    return this.phasesRepository.findNextBySeasonIds(seasonIds, dbOrTx);
  }

  async listExternalByPhaseIds(
    phaseIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalPhase[]> {
    return this.phasesRepository.listExternalByPhaseIds(phaseIds, dbOrTx);
  }

  async findPreviousPhase(
    currentPhaseId: string,
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase | null> {
    return this.phasesRepository.findPreviousPhase(
      currentPhaseId,
      startPhaseTemplateId,
      endPhaseTemplateId,
      dbOrTx,
    );
  }

  async findNextPhase(
    currentPhaseId: string,
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase | null> {
    return this.phasesRepository.findNextPhase(
      currentPhaseId,
      startPhaseTemplateId,
      endPhaseTemplateId,
      dbOrTx,
    );
  }

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBPhase | null> {
    return this.phasesRepository.findById(id, dbOrTx);
  }
}
