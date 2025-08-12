import { DBPhaseTemplate } from "./phaseTemplates.types.js";
import { NotFoundError } from "../../lib/errors.js";
import { db, DBOrTx } from "../../db/index.js";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { DBPhaseTemplateInsert } from "./phaseTemplates.types.js";
import { PhaseTemplatesQueryService } from "./phaseTemplates.query.service.js";
import { PhaseTemplatesMutationService } from "./phaseTemplates.mutation.service.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { LeagueTypesQueryService } from "../leagueTypes/leagueTypes.query.service.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";
import {
  DBLeagueType,
  LEAGUE_TYPE_SLUGS,
  LeagueTypeIdSchema,
} from "../leagueTypes/leagueTypes.types.js";

@injectable()
export class PhaseTemplatesService {
  constructor(
    @inject(TYPES.LeagueTypesQueryService)
    private leagueTypesQueryService: LeagueTypesQueryService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
    @inject(TYPES.PhaseTemplatesQueryService)
    private phaseTemplatesQueryService: PhaseTemplatesQueryService,
    @inject(TYPES.PhaseTemplatesMutationService)
    private phaseTemplatesMutationService: PhaseTemplatesMutationService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
  ) {}

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    const sportLeague = await this.sportLeaguesQueryService.findById(
      sportLeagueId,
      dbOrTx,
    );
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
    options: { excludeStarted?: boolean } = {},
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    const isId = LeagueTypeIdSchema.safeParse(typeIdOrSlug).success;

    let leagueType: DBLeagueType | null = null;
    if (isId) {
      leagueType = await this.leagueTypesQueryService.findById(
        typeIdOrSlug,
        dbOrTx,
      );
    } else {
      leagueType = await this.leagueTypesQueryService.findBySlug(
        typeIdOrSlug as LEAGUE_TYPE_SLUGS,
        dbOrTx,
      );
    }
    if (!leagueType) {
      throw new NotFoundError("League type not found");
    }

    // Get all templates for the sport league
    const allTemplates = await this.listBySportLeagueId(
      leagueType.sportLeagueId,
      dbOrTx,
    );

    const excludeStarted = options.excludeStarted ?? false;
    if (!excludeStarted) {
      return allTemplates;
    }

    // Find current (active) season for the sport league
    const currentSeason =
      await this.seasonsQueryService.findCurrentBySportLeagueId(
        leagueType.sportLeagueId,
        dbOrTx,
      );

    // If no active season, return all templates (offseason)
    if (!currentSeason) {
      return allTemplates;
    }

    // There is an active season: include only templates that correspond to phases
    // that have not yet started in this season
    const phases = await this.phasesQueryService.listBySeasonIds(
      [currentSeason.id],
      dbOrTx,
    );

    const now = new Date();
    const upcomingTemplateIds = new Set(
      phases
        .filter((p) => new Date(p.startDate) > now)
        .map((p) => p.phaseTemplateId),
    );

    return allTemplates.filter((t) => upcomingTemplateIds.has(t.id));
  }
}
