import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { StandingsService } from "../../features/standings/standings.service.js";

const router = Router();
const standingsService = container.get<StandingsService>(
  TYPES.StandingsService,
);

const cronLabel = "Standings cron";

router.get("/", async (_req: Request, res: Response) => {
  console.time(cronLabel);

  await standingsService.calculateStandingsForAllLeagues();

  console.timeEnd(cronLabel);
  res.status(200).json({
    message: "success",
  });
});

export default router;
