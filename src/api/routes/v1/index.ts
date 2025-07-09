import { Router } from "express";
import profileRouter from "./profile";
import leaguesRouter from "./leagues";
import leagueTypesRouter from "./league-types";
import leagueInvitesRouter from "./league-invites";

const router = Router();

router.use("/profile", profileRouter);
router.use("/leagues", leaguesRouter);
router.use("/league-types", leagueTypesRouter);
router.use("/league-invites", leagueInvitesRouter);

export default router;
