import { Router } from "express";
import leagueInvitesRouter from "./league-invites";
import leagueTypesRouter from "../../../features/leagueTypes/leagueTypes.router";
import leaguesRouter from "../../../features/leagues/leagues.router";
import profilesRouter from "../../../features/profiles/profiles.router";

const router = Router();

router.use("/league-invites", leagueInvitesRouter);
router.use("/league-types", leagueTypesRouter);
router.use("/leagues", leaguesRouter);
router.use("/profiles", profilesRouter);

export default router;
