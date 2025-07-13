import { Router, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth";
import { UnauthorizedError } from "../../lib/errors";
import { LeagueTypeIdOrSlugSchema } from "./leagueTypes.types";
import { DBUser } from "../users/users.types";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesService } from "../leagues/leagues.service";
import { PhaseTemplatesService } from "../phaseTemplates/phaseTemplates.service";
import { LeagueTypesService } from "./leagueTypes.service";

const router = Router();
const leagueTypesService = container.get<LeagueTypesService>(
  TYPES.LeagueTypesService,
);
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);
const phaseTemplatesService = container.get<PhaseTemplatesService>(
  TYPES.PhaseTemplatesService,
);

router.get("/:typeIdOrSlug/my-leagues", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    throw new UnauthorizedError();
  }
  const typeIdOrSlug = LeagueTypeIdOrSlugSchema.parse(req.params.typeIdOrSlug);

  const leagues = await leaguesService.listForUserByIdAndLeagueTypeIdOrSlug(
    session.user.id,
    typeIdOrSlug,
  );
  res.status(200).json(leagues);
});

router.get(
  "/:typeIdOrSlug/phase-templates",
  async (req: Request, res: Response) => {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      throw new UnauthorizedError();
    }
    const typeIdOrSlug = LeagueTypeIdOrSlugSchema.parse(
      req.params.typeIdOrSlug,
    );
    const templates =
      await phaseTemplatesService.listByLeagueTypeIdOrSlug(typeIdOrSlug);

    res.status(200).json(templates);
  },
);

router.get("/:typeIdOrSlug", async (req: Request, res: Response) => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    throw new UnauthorizedError();
  }

  const typeIdOrSlug = LeagueTypeIdOrSlugSchema.parse(req.params.typeIdOrSlug);
  const leagueType = await leagueTypesService.getByIdOrSlug(typeIdOrSlug);

  res.status(200).json(leagueType);
});

export default router;
