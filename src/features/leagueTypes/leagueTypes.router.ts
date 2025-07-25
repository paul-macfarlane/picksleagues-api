import { Router, Request, Response } from "express";
import { LeagueTypeIdOrSlugSchema } from "./leagueTypes.types.js";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeaguesService } from "../leagues/leagues.service.js";
import { PhaseTemplatesService } from "../phaseTemplates/phaseTemplates.service.js";
import { LeagueTypesService } from "./leagueTypes.service.js";
import { requireAuth } from "../../lib/auth.middleware.js";
import { LeagueIncludeSchema } from "../leagues/leagues.types.js";

const router = Router();
const leagueTypesService = container.get<LeagueTypesService>(
  TYPES.LeagueTypesService,
);
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);
const phaseTemplatesService = container.get<PhaseTemplatesService>(
  TYPES.PhaseTemplatesService,
);

router.use(requireAuth);

router.get("/:typeIdOrSlug/my-leagues", async (req: Request, res: Response) => {
  const typeIdOrSlug = LeagueTypeIdOrSlugSchema.parse(req.params.typeIdOrSlug);
  const query = LeagueIncludeSchema.parse(req.query);

  const leagues = await leaguesService.listByUserIdAndLeagueTypeIdOrSlug(
    req.user!.id,
    typeIdOrSlug,
    query,
  );
  res.status(200).json(leagues);
});

router.get(
  "/:typeIdOrSlug/phase-templates",
  async (req: Request, res: Response) => {
    const typeIdOrSlug = LeagueTypeIdOrSlugSchema.parse(
      req.params.typeIdOrSlug,
    );
    const templates =
      await phaseTemplatesService.listByLeagueTypeIdOrSlug(typeIdOrSlug);

    res.status(200).json(templates);
  },
);

router.get("/:typeIdOrSlug", async (req: Request, res: Response) => {
  const typeIdOrSlug = LeagueTypeIdOrSlugSchema.parse(req.params.typeIdOrSlug);
  const leagueType = await leagueTypesService.getByIdOrSlug(typeIdOrSlug);

  res.status(200).json(leagueType);
});

export default router;
