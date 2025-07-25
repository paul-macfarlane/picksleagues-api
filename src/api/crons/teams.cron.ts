import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { TeamsService } from "../../features/teams/teams.service.js";

const router = Router();
const teamsService = container.get<TeamsService>(TYPES.TeamsService);

const cronLabel = "Teams cron";

router.get("/", async (_req: Request, res: Response) => {
  console.time(cronLabel);
  await teamsService.syncTeams();
  console.timeEnd(cronLabel);
  res.status(200).json({ message: "success" });
});

export default router;
