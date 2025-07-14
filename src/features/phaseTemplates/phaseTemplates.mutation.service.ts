import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { PhaseTemplatesRepository } from "./phaseTemplates.repository";
import { DBPhaseTemplate, DBPhaseTemplateInsert } from "./phaseTemplates.types";

@injectable()
export class PhaseTemplatesMutationService {
  constructor(
    @inject(TYPES.PhaseTemplatesRepository)
    private phaseTemplatesRepository: PhaseTemplatesRepository,
  ) {}

  async create(
    data: DBPhaseTemplateInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate> {
    return this.phaseTemplatesRepository.create(data, dbOrTx);
  }
}
