import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { SportLeaguesService } from "../../features/sportLeagues/sportLeagues.service";

const router = Router();
const sportLeaguesService = container.get<SportLeaguesService>(
  TYPES.SportLeaguesService,
);

const cronLabel = "Sport leagues cron";

router.get("/", async (_req: Request, res: Response) => {
  console.time(cronLabel);
  await sportLeaguesService.syncSportLeagues();
  console.timeEnd(cronLabel);
  res.status(200).json({ message: "success" });
});

export default router;
