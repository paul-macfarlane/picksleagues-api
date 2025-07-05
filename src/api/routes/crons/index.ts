import { Router } from "express";
import sportLeaguesRouter from "./sportLeagues";

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

router.use("/sportLeagues", sportLeaguesRouter);

export default router;