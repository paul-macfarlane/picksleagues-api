import { Router } from "express";
import { container } from "../../lib/inversify.config";
import { UsersService } from "./users.service";
import { requireAuth } from "../../lib/auth.middleware";
import { LeaguesService } from "../leagues/leagues.service";
import { LeagueIncludeSchema } from "../leagues/leagues.types";
import { TYPES } from "../../lib/inversify.types";

const usersRouter = Router();

const usersService = container.get<UsersService>(TYPES.UsersService);
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);

usersRouter.get("/me/leagues", requireAuth, async (req, res) => {
  const query = LeagueIncludeSchema.parse(req.query);
  const leagues = await leaguesService.listLeaguesForUser(req.user!.id, query);
  res.json(leagues);
});

usersRouter.delete("/me", requireAuth, async (req, res) => {
  await usersService.anonymizeAccount(String(req.user!.id));
  res.status(204).send();
});

export default usersRouter;
