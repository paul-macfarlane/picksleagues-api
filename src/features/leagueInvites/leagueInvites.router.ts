import { Request, Response, Router } from "express";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeagueInvitesService } from "./leagueInvites.service.js";
import {
  CreateLeagueInviteSchema,
  LeagueInviteIdSchema,
  LeagueInviteIncludeSchema,
  LeagueInviteTokenSchema,
  RespondToLeagueInviteSchema,
} from "./leagueInvites.types.js";
import { requireAuth } from "../../lib/auth.middleware.js";

const leagueInvitesRouter = Router();
const leagueInvitesService = container.get<LeagueInvitesService>(
  TYPES.LeagueInvitesService,
);

leagueInvitesRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parseInvite = CreateLeagueInviteSchema.parse(req.body);

    const invite = await leagueInvitesService.create(req.user!.id, parseInvite);

    res.status(201).json(invite);
  },
);

leagueInvitesRouter.post(
  "/:inviteId/respond",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parseId = LeagueInviteIdSchema.parse(req.params.inviteId);

    const parseResponse = RespondToLeagueInviteSchema.parse(req.body);

    await leagueInvitesService.respond(
      req.user!.id,
      parseId,
      parseResponse.response,
    );

    res.status(204).send();
  },
);

leagueInvitesRouter.get(
  "/my-invites",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const query = LeagueInviteIncludeSchema.parse(req.query);
    const invites = await leagueInvitesService.getMyInvites(
      req.user!.id,
      query,
    );
    res.status(200).json(invites);
  },
);

leagueInvitesRouter.delete(
  "/:inviteId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parseId = LeagueInviteIdSchema.parse(req.params.inviteId);

    await leagueInvitesService.revoke(req.user!.id, parseId);

    res.status(204).send();
  },
);

leagueInvitesRouter.get(
  "/token/:token",
  async (req: Request, res: Response): Promise<void> => {
    const parseToken = LeagueInviteTokenSchema.parse(req.params.token);
    const query = LeagueInviteIncludeSchema.parse(req.query);

    const invite = await leagueInvitesService.getInviteByToken(
      parseToken,
      query,
    );
    res.status(200).json(invite);
  },
);

leagueInvitesRouter.post(
  "/token/:token/join",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parseToken = LeagueInviteTokenSchema.parse(req.params.token);

    await leagueInvitesService.joinWithToken(req.user!.id, parseToken);

    res.status(204).send();
  },
);

export { leagueInvitesRouter };
