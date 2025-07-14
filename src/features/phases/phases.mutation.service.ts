import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { PhasesRepository } from "./phases.repository";
import {
  DBExternalPhase,
  DBExternalPhaseInsert,
  DBPhase,
  DBPhaseInsert,
  DBPhaseUpdate,
} from "./phases.types";

@injectable()
export class PhasesMutationService {
  constructor(
    @inject(TYPES.PhasesRepository)
    private phasesRepository: PhasesRepository,
  ) {}

  async create(data: DBPhaseInsert, dbOrTx?: DBOrTx): Promise<DBPhase> {
    return this.phasesRepository.create(data, dbOrTx);
  }

  async update(
    id: string,
    data: DBPhaseUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBPhase> {
    return this.phasesRepository.update(id, data, dbOrTx);
  }

  async createExternal(
    data: DBExternalPhaseInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalPhase> {
    return this.phasesRepository.createExternal(data, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    data: Partial<DBExternalPhaseInsert>,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalPhase> {
    return this.phasesRepository.updateExternal(
      dataSourceId,
      externalId,
      data,
      dbOrTx,
    );
  }
}
