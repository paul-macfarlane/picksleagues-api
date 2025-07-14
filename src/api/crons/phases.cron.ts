import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { handleApiError } from "../../lib/errors";
import { PhasesService } from "../../features/phases/phases.service";

const router = Router();
const phasesService = container.get<PhasesService>(TYPES.PhasesService);

router.get("/", async (_req: Request, res: Response) => {
  console.log("Starting phases cron");

  try {
    await phasesService.syncPhases();
    console.log("Phases cron completed");
    res.status(200).json({ message: "success" });
  } catch (err) {
    handleApiError(err, res);
  }
});

export default router;
