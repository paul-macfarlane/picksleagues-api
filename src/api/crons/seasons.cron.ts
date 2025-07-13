import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { SeasonsService } from "../../features/seasons/seasons.service";
import { handleApiError } from "../../lib/errors";

const router = Router();
const seasonsService = container.get<SeasonsService>(TYPES.SeasonsService);

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting seasons cron");

  try {
    await seasonsService.syncSeasons();
    console.log("Seasons cron completed");
    res.status(200).json({ message: "success" });
  } catch (err) {
    handleApiError(err, res);
  }
});

export default router;
