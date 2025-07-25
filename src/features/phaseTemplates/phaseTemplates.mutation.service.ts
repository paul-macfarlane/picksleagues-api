import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PhaseTemplatesRepository } from "./phaseTemplates.repository.js";
import { DBPhaseTemplate, DBPhaseTemplateInsert } from "./phaseTemplates.types.js";

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
