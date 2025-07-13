import { Router, Request, Response } from "express";
import { container } from "../../../lib/inversify.config";
import { TYPES } from "../../../lib/inversify.types";
import { SportLeaguesService } from "../../../features/sportLeagues/sportLeagues.service";
import { handleApiError } from "../../../lib/errors";

const router = Router();
const sportLeaguesService = container.get<SportLeaguesService>(
  TYPES.SportLeaguesService,
);

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting sport leagues cron");

  try {
    await sportLeaguesService.syncSportLeagues();
    console.log("Sport leagues cron completed");
    res.status(200).json({ message: "success" });
  } catch (err) {
    handleApiError(err, res);
  }
});

export default router;
