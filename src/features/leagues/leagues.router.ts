import { Router, Request, Response } from "express";
import { auth } from "../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser } from "../users/users.types";
import { CreateLeagueSchema, LeagueIdSchema } from "./leagues.types";
import { UnauthorizedError } from "../../lib/errors";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { LeaguesService } from "./leagues.service";

const router = Router();
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    throw new UnauthorizedError();
  }

  const leagueData = CreateLeagueSchema.parse(req.body);
  const newLeague = await leaguesService.create(session.user.id, leagueData);

  res.status(201).json(newLeague);
});

router.get("/:leagueId", async (req: Request, res: Response): Promise<void> => {
  const session = (await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })) as { user: DBUser };
  if (!session) {
    throw new UnauthorizedError();
  }

  const leagueId = LeagueIdSchema.parse(req.params.leagueId);
  const league = await leaguesService.getForUserByIdWithLeagueType(
    session.user.id,
    leagueId,
  );

  res.status(200).json(league);
});

router.get(
  "/:leagueId/members",
  async (req: Request, res: Response): Promise<void> => {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      throw new UnauthorizedError();
    }

    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const members = await leaguesService.listMembersForUserByIdWithProfile(
      session.user.id,
      leagueId,
    );

    res.status(200).json(members);
  },
);

router.get(
  "/:leagueId/invites",
  async (req: Request, res: Response): Promise<void> => {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })) as { user: DBUser };
    if (!session) {
      throw new UnauthorizedError();
    }

    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const invites =
      await leaguesService.listPendingInvitesForUserByIdWithLeagueAndType(
        session.user.id,
        leagueId,
      );

    res.status(200).json(invites);
  },
);

export default router;
