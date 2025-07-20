import { Router } from "express";
import { leagueInvitesRouter } from "../features/leagueInvites/leagueInvites.router";
import leagueTypesRouter from "../features/leagueTypes/leagueTypes.router";
import leaguesRouter from "../features/leagues/leagues.router";
import profilesRouter from "../features/profiles/profiles.router";
import usersRouter from "../features/users/users.router";

const router = Router();

router.use("/league-invites", leagueInvitesRouter);
router.use("/league-types", leagueTypesRouter);
router.use("/leagues", leaguesRouter);
router.use("/profiles", profilesRouter);
router.use("/users", usersRouter);

export default router;
