import { Router } from "express";
import profileRouter from "./profile";
import leaguesRouter from "./leagues";
import leagueTypesRouter from "./league-types";

const router = Router();

router.use("/profile", profileRouter);
router.use("/leagues", leaguesRouter);
router.use("/league-types", leagueTypesRouter);

export default router;
