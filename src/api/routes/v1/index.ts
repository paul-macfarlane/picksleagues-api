import { Router } from "express";
import profilesRouter from "../../../features/profiles/profiles.router";
import leaguesRouter from "./leagues";
import leagueTypesRouter from "./league-types";
import leagueInvitesRouter from "./league-invites";

const router = Router();

router.use("/profiles", profilesRouter);
router.use("/leagues", leaguesRouter);
router.use("/league-types", leagueTypesRouter);
router.use("/league-invites", leagueInvitesRouter);

export default router;
