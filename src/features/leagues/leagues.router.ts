import { Router, Request, Response } from "express";
import {
  CreateLeagueSchema,
  LeagueIdSchema,
  LeagueIncludeSchema,
} from "./leagues.types";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesService } from "./leagues.service";
import { requireAuth } from "../../lib/auth.middleware";
import { LeagueMemberIncludeSchema } from "../leagueMembers/leagueMembers.types";

const router = Router();
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);

router.use(requireAuth);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const leagueData = CreateLeagueSchema.parse(req.body);
  const newLeague = await leaguesService.create(req.user!.id, leagueData);

  res.status(201).json(newLeague);
});

router.get("/:leagueId", async (req: Request, res: Response): Promise<void> => {
  const leagueId = LeagueIdSchema.parse(req.params.leagueId);
  const query = LeagueIncludeSchema.parse(req.query);

  const league = await leaguesService.getForUserById(req.user!.id, leagueId, {
    include: query?.include,
  });

  res.status(200).json(league);
});

router.get(
  "/:leagueId/members",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = LeagueMemberIncludeSchema.parse(req.query);
    const members = await leaguesService.listMembersForUserById(
      req.user!.id,
      leagueId,
      { include: query?.include },
    );

    res.status(200).json(members);
  },
);

router.get(
  "/:leagueId/invites",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const invites =
      await leaguesService.listPendingInvitesForUserByIdWithLeagueAndType(
        req.user!.id,
        leagueId,
      );

    res.status(200).json(invites);
  },
);

export default router;
