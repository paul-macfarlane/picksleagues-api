import { injectable, inject } from "inversify";
import { DBOrTx } from "../../db/index.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PhaseTemplatesRepository } from "./phaseTemplates.repository.js";
import { DBPhaseTemplate } from "./phaseTemplates.types.js";

@injectable()
export class PhaseTemplatesQueryService {
  constructor(
    @inject(TYPES.PhaseTemplatesRepository)
    private phaseTemplatesRepository: PhaseTemplatesRepository,
  ) {}

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBPhaseTemplate | null> {
    return this.phaseTemplatesRepository.findById(id, dbOrTx);
  }

  async findBySportLeagueAndLabel(
    sportLeagueId: string,
    label: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBPhaseTemplate | null> {
    return this.phaseTemplatesRepository.findBySportLeagueAndLabel(
      sportLeagueId,
      label,
      dbOrTx,
    );
  }

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBPhaseTemplate[]> {
    return this.phaseTemplatesRepository.listBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
  }
}
