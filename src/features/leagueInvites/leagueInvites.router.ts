import { Request, Response, Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth";
import { DBUser } from "../users/users.types";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { LeagueInvitesService } from "./leagueInvites.service";
import {
  CreateLeagueInviteSchema,
  LeagueInviteIdSchema,
  LeagueInviteTokenSchema,
  RespondToLeagueInviteSchema,
} from "./leagueInvites.types";
import { handleApiError } from "../../lib/errors";

const leagueInvitesRouter = Router();
const leagueInvitesService = container.get<LeagueInvitesService>(
  TYPES.LeagueInvitesService,
);

leagueInvitesRouter.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = (await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })) as { user: DBUser };
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parseInvite = CreateLeagueInviteSchema.parse(req.body);

      const invite = await leagueInvitesService.create(
        session.user.id,
        parseInvite,
      );

      res.status(201).json(invite);
    } catch (err) {
      handleApiError(err, res);
    }
  },
);

leagueInvitesRouter.post(
  "/:inviteId/respond",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = (await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })) as { user: DBUser };
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parseId = LeagueInviteIdSchema.parse(req.params.inviteId);

      const parseResponse = RespondToLeagueInviteSchema.parse(req.body);

      await leagueInvitesService.respond(
        session.user.id,
        parseId,
        parseResponse.response,
      );

      res.status(204).send();
    } catch (err) {
      handleApiError(err, res);
    }
  },
);

leagueInvitesRouter.get(
  "/my-invites",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = (await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })) as { user: DBUser };
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const invites =
        await leagueInvitesService.listPendingByUserIdWithLeagueAndType(
          session.user.id,
        );
      res.status(200).json(invites);
    } catch (err) {
      handleApiError(err, res);
    }
  },
);

leagueInvitesRouter.delete(
  "/:inviteId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = (await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })) as { user: DBUser };
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parseId = LeagueInviteIdSchema.parse(req.params.inviteId);

      await leagueInvitesService.revoke(session.user.id, parseId);

      res.status(204).send();
    } catch (err) {
      handleApiError(err, res);
    }
  },
);

leagueInvitesRouter.get(
  "/token/:token",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parseToken = LeagueInviteTokenSchema.parse(req.params.token);

      const invite =
        await leagueInvitesService.getByTokenWithLeagueAndType(parseToken);
      res.status(200).json(invite);
    } catch (err) {
      handleApiError(err, res);
    }
  },
);

leagueInvitesRouter.post(
  "/token/:token/join",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = (await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })) as { user: DBUser };
      if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parseToken = LeagueInviteTokenSchema.parse(req.params.token);

      await leagueInvitesService.joinWithToken(session.user.id, parseToken);

      res.status(204).send();
    } catch (err) {
      handleApiError(err, res);
    }
  },
);

export { leagueInvitesRouter };
