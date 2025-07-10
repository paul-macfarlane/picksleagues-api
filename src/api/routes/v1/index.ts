import { Router } from "express";
import profileRouter from "./profiles";
import leaguesRouter from "./leagues";
import leagueTypesRouter from "./league-types";
import leagueInvitesRouter from "./league-invites";

const router = Router();

router.use("/profiles", profileRouter);
router.use("/leagues", leaguesRouter);
router.use("/league-types", leagueTypesRouter);
router.use("/league-invites", leagueInvitesRouter);

export default router;
