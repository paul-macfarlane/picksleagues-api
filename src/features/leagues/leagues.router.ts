import { Router, Request, Response } from "express";
import {
  CreateLeagueSchema,
  LeagueIdSchema,
  LeagueIncludeSchema,
  UpdateLeagueSchema,
} from "./leagues.types.js";
import { container } from "../../lib/inversify.config.js";
import { TYPES } from "../../lib/inversify.types.js";
import { LeaguesService } from "./leagues.service.js";
import { requireAuth } from "../../lib/auth.middleware.js";
import {
  LeagueMemberIncludeSchema,
  UpdateLeagueMemberSchema,
} from "../leagueMembers/leagueMembers.types.js";
import { LeagueMembersService } from "../leagueMembers/leagueMembers.service.js";
import { LeagueInviteIncludeSchema } from "../leagueInvites/leagueInvites.types.js";
import { LeagueInvitesService } from "../leagueInvites/leagueInvites.service.js";
import { UserIdSchema } from "../profiles/profiles.types.js";
import { PhasesService } from "../phases/phases.service.js";
import { PhaseIncludesSchema, PhaseIdSchema } from "../phases/phases.types.js";
import { PicksService } from "../picks/picks.service.js";
import { PickIncludesSchema } from "../picks/picks.types.js";

const router = Router();
const leaguesService = container.get<LeaguesService>(TYPES.LeaguesService);
const leagueMembersService = container.get<LeagueMembersService>(
  TYPES.LeagueMembersService,
);
const leagueInvitesService = container.get<LeagueInvitesService>(
  TYPES.LeagueInvitesService,
);
const phasesService = container.get<PhasesService>(TYPES.PhasesService);
const picksService = container.get<PicksService>(TYPES.PicksService);

router.use(requireAuth);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const leagueData = CreateLeagueSchema.parse(req.body);
  const newLeague = await leaguesService.create(req.user!.id, leagueData);

  res.status(201).json(newLeague);
});

router.get("/:leagueId", async (req: Request, res: Response): Promise<void> => {
  const leagueId = LeagueIdSchema.parse(req.params.leagueId);
  const query = LeagueIncludeSchema.parse(req.query);
  const league = await leaguesService.getByIdForUser(req.user!.id, leagueId, {
    include: query?.include,
  });

  res.status(200).json(league);
});

router.patch(
  "/:leagueId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const update = UpdateLeagueSchema.parse(req.body);

    const updatedLeague = await leaguesService.update(
      req.user!.id,
      leagueId,
      update,
    );

    res.status(200).json(updatedLeague);
  },
);

router.delete(
  "/:leagueId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    await leaguesService.delete(req.user!.id, leagueId);
    res.status(204).send();
  },
);

router.get(
  "/:leagueId/members",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = LeagueMemberIncludeSchema.parse(req.query);
    const members = await leagueMembersService.listByLeagueIdForUser(
      req.user!.id,
      leagueId,
      query,
    );

    res.status(200).json(members);
  },
);

router.get(
  "/:leagueId/invites",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = LeagueInviteIncludeSchema.parse(req.query);
    const invites = await leagueInvitesService.listByLeagueIdForUser(
      req.user!.id,
      leagueId,
      query,
    );

    res.status(200).json(invites);
  },
);

router.patch(
  "/:leagueId/members/:userId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const targetUserId = UserIdSchema.parse(req.params.userId);
    const update = UpdateLeagueMemberSchema.parse(req.body);

    const updatedMember = await leagueMembersService.update(
      req.user!.id,
      leagueId,
      targetUserId,
      update,
    );

    res.status(200).json(updatedMember);
  },
);

router.delete(
  "/:leagueId/members/me",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);

    await leagueMembersService.leaveLeague(req.user!.id, leagueId);

    res.status(204).send();
  },
);

router.delete(
  "/:leagueId/members/:userId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const targetUserId = UserIdSchema.parse(req.params.userId);

    await leagueMembersService.removeMember(
      req.user!.id,
      leagueId,
      targetUserId,
    );

    res.status(204).send();
  },
);

router.get(
  "/:leagueId/current-phase",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = PhaseIncludesSchema.parse(req.query);

    const currentPhase = await phasesService.getCurrentPhaseForLeague(
      req.user!.id,
      leagueId,
      query?.include,
    );

    res.status(200).json(currentPhase);
  },
);

router.get(
  "/:leagueId/phases/:phaseId",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const phaseId = PhaseIdSchema.parse(req.params.phaseId);
    const query = PhaseIncludesSchema.parse(req.query);

    const phase = await phasesService.getPhaseByIdAndLeagueId(
      req.user!.id,
      phaseId,
      leagueId,
      query?.include,
    );

    res.status(200).json(phase);
  },
);

// Get current user's picks for a specific phase in a league
router.get(
  "/:leagueId/phases/:phaseId/my-picks",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const phaseId = PhaseIdSchema.parse(req.params.phaseId);
    const query = PickIncludesSchema.parse(req.query);

    const picks = await picksService.getPicksForUserInPhase(
      req.user!.id,
      leagueId,
      phaseId,
      query?.include,
    );

    res.status(200).json(picks);
  },
);

// Get all picks for a league and phase (for all users)
router.get(
  "/:leagueId/phases/:phaseId/picks",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const phaseId = PhaseIdSchema.parse(req.params.phaseId);
    const query = PickIncludesSchema.parse(req.query);

    const picks = await picksService.getAllPicksForLeagueAndPhase(
      req.user!.id,
      leagueId,
      phaseId,
      query?.include,
    );

    res.status(200).json(picks);
  },
);

// Get current user's picks for the current phase in a league
router.get(
  "/:leagueId/current-phase/my-picks",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = PickIncludesSchema.parse(req.query);

    const picks = await picksService.getPicksForUserInCurrentPhase(
      req.user!.id,
      leagueId,
      query?.include,
    );

    res.status(200).json(picks);
  },
);

// Get all picks for the current phase in a league (for all users)
router.get(
  "/:leagueId/current-phase/picks",
  async (req: Request, res: Response): Promise<void> => {
    const leagueId = LeagueIdSchema.parse(req.params.leagueId);
    const query = PickIncludesSchema.parse(req.query);

    const picks = await picksService.getAllPicksForCurrentPhase(
      req.user!.id,
      leagueId,
      query?.include,
    );

    res.status(200).json(picks);
  },
);

export default router;
