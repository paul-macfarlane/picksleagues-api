import { DBPhaseTemplate } from "./phaseTemplates.types";
import { NotFoundError } from "../../lib/errors";
import { db, DBOrTx } from "../../db";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { LeagueTypesService } from "../leagueTypes/leagueTypes.service";
import { SportLeaguesService } from "../sportLeagues/sportLeagues.service";
import { DBPhaseTemplateInsert } from "./phaseTemplates.types";
import { PhaseTemplatesQueryService } from "./phaseTemplates.query.service";
import { PhaseTemplatesMutationService } from "./phaseTemplates.mutation.service";

@injectable()
export class PhaseTemplatesService {
  constructor(
    @inject(TYPES.LeagueTypesService)
    private leagueTypesService: LeagueTypesService,
    @inject(TYPES.SportLeaguesService)
    private sportLeaguesService: SportLeaguesService,
    @inject(TYPES.PhaseTemplatesQueryService)
    private phaseTemplatesQueryService: PhaseTemplatesQueryService,
    @inject(TYPES.PhaseTemplatesMutationService)
    private phaseTemplatesMutationService: PhaseTemplatesMutationService,
  ) {}

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    const sportLeague = await this.sportLeaguesService.findById(sportLeagueId);
    if (!sportLeague) {
      throw new NotFoundError("Sport league not found");
    }

    return this.phaseTemplatesQueryService.listBySportLeagueId(
      sportLeagueId,
      dbOrTx,
    );
  }

  async findOrCreate(
    data: DBPhaseTemplateInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate> {
    // todo validate sportLeagueId
    const existing =
      await this.phaseTemplatesQueryService.findBySportLeagueAndLabel(
        data.sportLeagueId,
        data.label,
        dbOrTx,
      );
    if (existing) {
      return existing;
    }
    return this.phaseTemplatesMutationService.create(data, dbOrTx);
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

    return this.listBySportLeagueId(leagueType.sportLeagueId, dbOrTx);
  }
}
