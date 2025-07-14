import { Router, Request, Response } from "express";
import { LeagueTypeIdOrSlugSchema } from "./leagueTypes.types";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesService } from "../leagues/leagues.service";
import { PhaseTemplatesService } from "../phaseTemplates/phaseTemplates.service";
import { LeagueTypesService } from "./leagueTypes.service";
import { requireAuth } from "../../lib/auth.middleware";
import { LeagueIncludeSchema } from "../leagues/leagues.types";

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
