import { Router } from "express";
import sportLeaguesRouter from "./crons/sport-leagues.cron.js";
import seasonsRouter from "./crons/seasons.cron.js";
import phasesRouter from "./crons/phases.cron.js";
import teamsRouter from "./crons/teams.cron.js";
import eventsRouter from "./crons/events.cron.js";
import standingsRouter from "./crons/standings.cron.js";

const router = Router();

router.use((req, res, next) => {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const apiKey = req.headers["x-cron-api-key"];
  if (apiKey !== process.env.CRON_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
});

router.use("/sport-leagues", sportLeaguesRouter);
router.use("/seasons", seasonsRouter);
router.use("/phases", phasesRouter);
router.use("/teams", teamsRouter);
router.use("/events", eventsRouter);
router.use("/standings", standingsRouter);

export default router;
