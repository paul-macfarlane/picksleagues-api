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
import {
  LeagueMemberIncludeSchema,
  UpdateLeagueMemberSchema,
} from "../leagueMembers/leagueMembers.types";
import { LeagueMembersService } from "../leagueMembers/leagueMembers.service";
import { LeagueInviteIncludeSchema } from "../leagueInvites/leagueInvites.types";
import { LeagueInvitesService } from "../leagueInvites/leagueInvites.service";

const router = Router();
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);
const leagueMembersService = container.get<LeagueMembersService>(
  TYPES.LeagueMembersService,
);
const leagueInvitesService = container.get<LeagueInvitesService>(
  TYPES.LeagueInvitesService,
);

router.use(requireAuth);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const leagueData = CreateLeagueSchema.parse(req.body);
  const newLeague = await leaguesService.create(req.user!.id, leagueData);

  res.status(201).json(newLeague);
});

router.get("/:leagueId", async (req: Request, res: Response): Promise<void> => {
  const leagueId = LeagueIdSchema.parse(req.params.leagueId);
  const query = LeagueIncludeSchema.parse(req.query);
  const league = await leaguesService.getByIdForUser(req.user!.id, leagueId, {
    include: query?.include,
  });

  res.status(200).json(league);
});

router.get(
  "/:leagueId/members",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = LeagueMemberIncludeSchema.parse(req.query);
    const members = await leagueMembersService.listByLeagueIdForUser(
      req.user!.id,
      leagueId,
      query,
    );

    res.status(200).json(members);
  },
);

router.get(
  "/:leagueId/invites",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = LeagueInviteIncludeSchema.parse(req.query);
    const invites = await leagueInvitesService.listByLeagueIdForUser(
      req.user!.id,
      leagueId,
      query,
    );

    res.status(200).json(invites);
  },
);

router.patch(
  "/:leagueId/members/:userId",
  async (req: Request, res: Response): Promise<void> => {
    const { leagueId, userId } = req.params;
    const update = UpdateLeagueMemberSchema.parse(req.body);

    const updatedMember = await leagueMembersService.update(
      req.user!.id,
      leagueId,
      userId,
      update,
    );

    res.status(200).json(updatedMember);
  },
);

export default router;
