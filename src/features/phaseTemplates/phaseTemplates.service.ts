import { DBPhaseTemplate } from "./phaseTemplates.types";
import { NotFoundError } from "../../lib/errors";
import { db, DBOrTx } from "../../db";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { PhaseTemplatesRepository } from "./phaseTemplates.repository";
import { LeagueTypesService } from "../leagueTypes/leagueTypes.service";
import { SportLeaguesService } from "../sportLeagues/sportLeagues.service";
import { DBPhaseTemplateInsert } from "./phaseTemplates.types";

@injectable()
export class PhaseTemplatesService {
  constructor(
    @inject(TYPES.PhaseTemplatesRepository)
    private phaseTemplatesRepository: PhaseTemplatesRepository,
    @inject(TYPES.LeagueTypesService)
    private leagueTypesService: LeagueTypesService,
    @inject(TYPES.SportLeaguesService)
    private sportLeaguesService: SportLeaguesService,
  ) {}

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    const sportLeague = await this.sportLeaguesService.findById(sportLeagueId);
    if (!sportLeague) {
      throw new NotFoundError("Sport league not found");
    }

    return await this.phaseTemplatesRepository.listBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
  }

  async getById(id: string, dbOrTx: DBOrTx = db): Promise<DBPhaseTemplate> {
    const phaseTemplate = await this.phaseTemplatesRepository.findById(
      id,
      dbOrTx,
    );
    if (!phaseTemplate) {
      throw new NotFoundError("Phase template not found");
    }
    return phaseTemplate;
  }

  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate | null> {
    return await this.phaseTemplatesRepository.findById(id, dbOrTx);
  }

  async findBySportLeagueAndLabel(
    sportLeagueId: string,
    label: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate | null> {
    return await this.phaseTemplatesRepository.findBySportLeagueAndLabel(
      sportLeagueId,
      label,
      dbOrTx,
    );
  }

  async create(
    data: DBPhaseTemplateInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate> {
    // todo validate sportLeagueId
    return await this.phaseTemplatesRepository.create(data, dbOrTx);
  }

  async findOrCreate(
    data: DBPhaseTemplateInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate> {
    const existing = await this.findBySportLeagueAndLabel(
      data.sportLeagueId,
      data.label,
      dbOrTx,
    );
    if (existing) {
      return existing;
    }
    return await this.create(data, dbOrTx);
  }

  async listByLeagueTypeIdOrSlug(
    typeIdOrSlug: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    const leagueType = await this.leagueTypesService.findByIdOrSlug(
      typeIdOrSlug,
      dbOrTx,
    );
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    return await this.listBySportLeagueId(leagueType.sportLeagueId, dbOrTx);
  }
}
