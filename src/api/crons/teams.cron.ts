import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { TeamsService } from "../../features/teams/teams.service";

const router = Router();
const teamsService = container.get<TeamsService>(TYPES.TeamsService);

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting teams cron");
  await teamsService.syncTeams();
  console.log("Teams cron completed");
  res.status(200).json({ message: "success" });
});

export default router;
