import { Router } from "express";
import { leagueInvitesRouter } from "../features/leagueInvites/leagueInvites.router.js";
import leagueTypesRouter from "../features/leagueTypes/leagueTypes.router.js";
import leaguesRouter from "../features/leagues/leagues.router.js";
import profilesRouter from "../features/profiles/profiles.router.js";
import usersRouter from "../features/users/users.router.js";

const router = Router();

router.use("/league-invites", leagueInvitesRouter);
router.use("/league-types", leagueTypesRouter);
router.use("/leagues", leaguesRouter);
router.use("/profiles", profilesRouter);
router.use("/users", usersRouter);

export default router;
