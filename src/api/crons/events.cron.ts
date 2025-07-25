import { Router, Request, Response } from "express";
import { container } from "../../lib/inversify.config";
import { TYPES } from "../../lib/inversify.types";
import { EventsService } from "../../features/events/events.service";

const router = Router();
const eventsService = container.get<EventsService>(TYPES.EventsService);

const cronLabel = "Events cron";

router.get("/", async (_req: Request, res: Response) => {
  console.time(cronLabel);
  await eventsService.syncEvents();
  console.timeEnd(cronLabel);
  res.status(200).json({ message: "success" });
});

router.get("/withOdds", async (_req: Request, res: Response) => {
  console.time(cronLabel);
  await eventsService.syncEventsWithOdds();
  console.timeEnd(cronLabel);
  res.status(200).json({ message: "success" });
});

export default router;
