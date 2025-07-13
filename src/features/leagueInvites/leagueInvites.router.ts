import { Request, Response, Router } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { LeagueInvitesService } from "./leagueInvites.service";
import {
  CreateLeagueInviteSchema,
  LeagueInviteIdSchema,
  LeagueInviteTokenSchema,
  RespondToLeagueInviteSchema,
} from "./leagueInvites.types";
import { requireAuth } from "../../lib/auth.middleware";

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
    const invites =
      await leagueInvitesService.listPendingByUserIdWithLeagueAndType(
        req.user!.id,
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

    const invite =
      await leagueInvitesService.getByTokenWithLeagueAndType(parseToken);
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
