import { injectable, inject } from "inversify";
import { DBOrTx, db } from "../../db";
import { TYPES } from "../../lib/inversify.types";
import { PhaseTemplatesRepository } from "./phaseTemplates.repository";
import { DBPhaseTemplate } from "./phaseTemplates.types";

@injectable()
export class PhaseTemplatesQueryService {
  constructor(
    @inject(TYPES.PhaseTemplatesRepository)
    private phaseTemplatesRepository: PhaseTemplatesRepository,
  ) {}

  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate | null> {
    return this.phaseTemplatesRepository.findById(id, dbOrTx);
  }

  async findBySportLeagueAndLabel(
    sportLeagueId: string,
    label: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate | null> {
    return this.phaseTemplatesRepository.findBySportLeagueAndLabel(
      sportLeagueId,
      label,
      dbOrTx,
    );
  }

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    return this.phaseTemplatesRepository.listBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
  }
}
