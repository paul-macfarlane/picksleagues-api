import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { SeasonsService } from "../../features/seasons/seasons.service.js";

const router = Router();
const seasonsService = container.get<SeasonsService>(TYPES.SeasonsService);

const cronLabel = "Seasons cron";

router.get("/", async (_req: Request, res: Response) => {
  console.time(cronLabel);
  await seasonsService.syncSeasons();
  console.timeEnd(cronLabel);
  res.status(200).json({ message: "success" });
});

export default router;
