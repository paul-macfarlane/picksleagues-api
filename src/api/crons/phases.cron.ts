import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { PhasesService } from "../../features/phases/phases.service";

const router = Router();
const phasesService = container.get<PhasesService>(TYPES.PhasesService);

const cronLabel = "Phases cron";

router.get("/", async (_req: Request, res: Response) => {
  console.time(cronLabel);
  await phasesService.syncPhases();
  console.timeEnd(cronLabel);
  res.status(200).json({ message: "success" });
});

export default router;
