import { Router, Request, Response } from "express";
import {
  CreateLeagueSchema,
  LeagueIdSchema,
  LeagueIncludeSchema,
  UpdateLeagueSchema,
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
import { UserIdSchema } from "../profiles/profiles.types";

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

router.patch(
  "/:leagueId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const update = UpdateLeagueSchema.parse(req.body);

    const updatedLeague = await leaguesService.update(
      req.user!.id,
      leagueId,
      update,
    );

    res.status(200).json(updatedLeague);
  },
);

router.delete(
  "/:leagueId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    await leaguesService.delete(req.user!.id, leagueId);
    res.status(204).send();
  },
);

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
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const targetUserId = UserIdSchema.parse(req.params.userId);
    const update = UpdateLeagueMemberSchema.parse(req.body);

    const updatedMember = await leagueMembersService.update(
      req.user!.id,
      leagueId,
      targetUserId,
      update,
    );

    res.status(200).json(updatedMember);
  },
);

router.delete(
  "/:leagueId/members/me",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);

    await leagueMembersService.leaveLeague(req.user!.id, leagueId);

    res.status(204).send();
  },
);

router.delete(
  "/:leagueId/members/:userId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const targetUserId = UserIdSchema.parse(req.params.userId);

    await leagueMembersService.removeMember(
      req.user!.id,
      leagueId,
      targetUserId,
    );

    res.status(204).send();
  },
);

export default router;
