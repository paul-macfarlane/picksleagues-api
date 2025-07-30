import { injectable, inject } from "inversify";
import { z } from "zod";
import { TYPES } from "../../lib/inversify.types.js";
import { PicksQueryService } from "./picks.query.service.js";
import { PicksMutationService } from "./picks.mutation.service.js";
import { EventsQueryService } from "../events/events.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { PhasesUtilService } from "../phases/phases.util.service.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { db } from "../../db/index.js";
import {
  PopulatedPick,
  PICK_INCLUDES,
  DBPick,
  SubmitPicksSchema,
  DBPickInsert,
} from "./picks.types.js";
import { DBOrTx } from "../../db/index.js";
import { PICK_EM_PICK_TYPES } from "../leagues/leagues.types.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";

@injectable()
export class PicksService {
  constructor(
    @inject(TYPES.PicksQueryService)
    private picksQueryService: PicksQueryService,
    @inject(TYPES.PicksMutationService)
    private picksMutationService: PicksMutationService,
    @inject(TYPES.EventsQueryService)
    private eventsQueryService: EventsQueryService,
    @inject(TYPES.ProfilesQueryService)
    private profilesQueryService: ProfilesQueryService,
    @inject(TYPES.TeamsQueryService)
    private teamsQueryService: TeamsQueryService,
    @inject(TYPES.LiveScoresQueryService)
    private liveScoresQueryService: LiveScoresQueryService,
    @inject(TYPES.OutcomesQueryService)
    private outcomesQueryService: OutcomesQueryService,
    @inject(TYPES.OddsQueryService)
    private oddsQueryService: OddsQueryService,
    @inject(TYPES.SportsbooksQueryService)
    private sportsbooksQueryService: SportsbooksQueryService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.PhasesUtilService)
    private phasesUtilService: PhasesUtilService,
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
  ) {}

  async getPicksForUserInPhase(
    userId: string,
    leagueId: string,
    phaseId: string,
    includes?: string[],
  ): Promise<PopulatedPick[]> {
    return db.transaction(async (tx) => {
      // Verify user is a member of the league
      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }

      // Get events for the phase
      const events = await this.eventsQueryService.listByPhaseIds(
        [phaseId],
        tx,
      );
      if (events.length === 0) {
        return [];
      }

      // Get picks for the user in this league that match the events in the phase
      const eventIds = events.map((event) => event.id);
      const picks =
        await this.picksQueryService.findByUserIdAndLeagueIdAndEventIds(
          userId,
          leagueId,
          eventIds,
          tx,
        );

      // Populate includes
      const populatedPicks: PopulatedPick[] = picks.map((pick: DBPick) => ({
        ...pick,
      }));

      if (includes) {
        await this._populatePickIncludes(populatedPicks, includes, tx);
      }

      return populatedPicks;
    });
  }

  async getAllPicksForLeagueAndPhase(
    userId: string,
    leagueId: string,
    phaseId: string,
    includes?: string[],
  ): Promise<PopulatedPick[]> {
    return db.transaction(async (tx) => {
      // Verify user is a member of the league
      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }

      // Get the phase to check pick lock time
      const phase = await this.phasesQueryService.findById(phaseId, tx);
      if (!phase) {
        throw new NotFoundError("Phase not found");
      }

      // Get events for the phase
      const events = await this.eventsQueryService.listByPhaseIds(
        [phaseId],
        tx,
      );
      if (events.length === 0) {
        return [];
      }

      // Get all picks for this league that match the events in the phase (only from current members)
      const eventIds = events.map((event) => event.id);
      const allPicks =
        await this.picksQueryService.findByLeagueIdAndEventIdsForMembers(
          leagueId,
          eventIds,
          tx,
        );

      // Filter picks based on pick lock time
      const currentTime = new Date();
      const isBeforeLockTime = currentTime < phase.pickLockTime;

      let filteredPicks: DBPick[];
      if (isBeforeLockTime) {
        // Before lock time: only return picks made by the requesting user
        filteredPicks = allPicks.filter((pick) => pick.userId === userId);
      } else {
        // After lock time: return all picks
        filteredPicks = allPicks;
      }

      // Populate includes
      const populatedPicks: PopulatedPick[] = filteredPicks.map(
        (pick: DBPick) => ({
          ...pick,
        }),
      );

      if (includes) {
        await this._populatePickIncludes(populatedPicks, includes, tx);
      }

      return populatedPicks;
    });
  }

  async getPicksForUserInCurrentPhase(
    userId: string,
    leagueId: string,
    includes?: string[],
  ): Promise<PopulatedPick[]> {
    // Get the current or next phase for the league
    const { id: phaseId } =
      await this.phasesUtilService.getCurrentOrNextPhaseForLeagueForUser(
        userId,
        leagueId,
      );

    return this.getPicksForUserInPhase(userId, leagueId, phaseId, includes);
  }

  async getAllPicksForCurrentPhase(
    userId: string,
    leagueId: string,
    includes?: string[],
  ): Promise<PopulatedPick[]> {
    // Get the current or next phase for the league
    const { id: phaseId } =
      await this.phasesUtilService.getCurrentOrNextPhaseForLeagueForUser(
        userId,
        leagueId,
      );

    return this.getAllPicksForLeagueAndPhase(
      userId,
      leagueId,
      phaseId,
      includes,
    );
  }

  async submitPicks(
    userId: string,
    leagueId: string,
    data: z.infer<typeof SubmitPicksSchema>,
  ): Promise<void> {
    return db.transaction(async (tx) => {
      // Verify user is a member of the league
      const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
        leagueId,
        userId,
        tx,
      );
      if (!member) {
        throw new ForbiddenError("You are not a member of this league");
      }

      // Get the league and its settings
      const league = await this.leaguesQueryService.findById(leagueId, tx);
      if (!league) {
        throw new NotFoundError("League not found");
      }

      // Get the current phase for the league (not next phase)
      const { id: phaseId } =
        await this.phasesUtilService.getCurrentPhaseOnlyForLeague(
          userId,
          leagueId,
          tx,
        );

      // Get the phase details to check pick lock time
      const phase = await this.phasesQueryService.findById(phaseId, tx);
      if (!phase) {
        throw new NotFoundError("Phase not found");
      }

      // Check if picks are locked (current time is past pick lock time)
      if (phase.pickLockTime <= new Date()) {
        throw new ForbiddenError("Picks are locked for this phase");
      }

      // Get events in the current phase
      const allPhaseEvents = await this.eventsQueryService.listByPhaseIds(
        [phaseId],
        tx,
      );
      if (allPhaseEvents.length === 0) {
        throw new NotFoundError("No events found for the current phase");
      }
      const futurePhaseEvents = allPhaseEvents.filter(
        (e) => e.startTime > new Date(),
      );

      // Parse league settings
      const settings = league.settings as {
        picksPerPhase: number;
        pickType: string;
      };
      const requiredPicks = Math.min(
        settings.picksPerPhase,
        futurePhaseEvents.length,
      );

      // Validate the number of picks submitted
      if (data.picks.length !== requiredPicks) {
        throw new ForbiddenError(
          `You must submit exactly ${requiredPicks} picks for this phase (${data.picks.length} submitted)`,
        );
      }

      // Get existing picks for this user in this phase
      const existingPicks =
        await this.picksQueryService.findByUserIdAndLeagueIdAndEventIds(
          userId,
          leagueId,
          allPhaseEvents.map((e) => e.id),
          tx,
        );

      // Check if user has already made picks for this phase
      if (existingPicks.length > 0) {
        throw new ForbiddenError("You have already made picks for this phase");
      }

      // Validate each pick
      const eventIds = new Set(data.picks.map((p) => p.eventId));
      if (eventIds.size !== data.picks.length) {
        throw new ForbiddenError("Duplicate events are not allowed");
      }

      // Validate all events are in the current phase and haven't started
      const eventMap = new Map(futurePhaseEvents.map((e) => [e.id, e]));
      for (const pick of data.picks) {
        const event = eventMap.get(pick.eventId);
        if (!event) {
          throw new ForbiddenError(
            `Event ${pick.eventId} is not in the current phase`,
          );
        }

        if (event.startTime <= new Date()) {
          throw new ForbiddenError(
            `Cannot make picks for events that have already started`,
          );
        }

        if (
          event.homeTeamId !== pick.teamId &&
          event.awayTeamId !== pick.teamId
        ) {
          throw new ForbiddenError(
            `Team ${pick.teamId} is not part of event ${pick.eventId}`,
          );
        }
      }

      // Create all picks
      for (const pickData of data.picks) {
        const event = eventMap.get(pickData.eventId)!;

        // Prepare pick data
        const pickInsert: DBPickInsert = {
          leagueId,
          userId,
          seasonId: phase.seasonId,
          eventId: pickData.eventId,
          teamId: pickData.teamId,
          spread: null, // Will be set below if needed
        };

        // If it's a pick'em league with spread picks, get the current spread
        if (settings.pickType === PICK_EM_PICK_TYPES.SPREAD) {
          const odds = await this.oddsQueryService.findByEventId(
            pickData.eventId,
            tx,
          );
          if (odds) {
            // Determine which spread to use based on the picked team
            if (pickData.teamId === event.homeTeamId) {
              pickInsert.spread = odds.spreadHome;
            } else {
              pickInsert.spread = odds.spreadAway;
            }
          }
        }

        // Create the pick
        await this.picksMutationService.create(pickInsert, tx);
      }
    });
  }

  private async _populatePickIncludes(
    picks: PopulatedPick[],
    includes: string[],
    tx: DBOrTx,
  ): Promise<void> {
    // Profile
    if (includes.includes(PICK_INCLUDES.PROFILE)) {
      for (const pick of picks) {
        const profile = await this.profilesQueryService.findByUserId(
          pick.userId,
          tx,
        );
        pick.profile = profile ?? undefined;
      }
    }

    // Team
    if (includes.includes(PICK_INCLUDES.TEAM)) {
      for (const pick of picks) {
        const team = await this.teamsQueryService.findById(pick.teamId, tx);
        pick.team = team ?? undefined;
      }
    }

    // Event and nested includes
    if (
      includes.includes(PICK_INCLUDES.EVENT) ||
      includes.includes(PICK_INCLUDES.EVENT_HOME_TEAM) ||
      includes.includes(PICK_INCLUDES.EVENT_AWAY_TEAM) ||
      includes.includes(PICK_INCLUDES.EVENT_LIVE_SCORE) ||
      includes.includes(PICK_INCLUDES.EVENT_OUTCOME) ||
      includes.includes(PICK_INCLUDES.EVENT_ODDS) ||
      includes.includes(PICK_INCLUDES.EVENT_ODDS_SPORTSBOOK)
    ) {
      for (const pick of picks) {
        const event = await this.eventsQueryService.findById(pick.eventId, tx);
        if (event) {
          pick.event = {
            id: event.id,
            phaseId: event.phaseId,
            startTime: event.startTime,
            type: event.type,
            homeTeamId: event.homeTeamId,
            awayTeamId: event.awayTeamId,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          };

          // Event home team
          if (
            includes.includes(PICK_INCLUDES.EVENT_HOME_TEAM) &&
            event.homeTeamId
          ) {
            const homeTeam = await this.teamsQueryService.findById(
              event.homeTeamId,
              tx,
            );
            pick.event.homeTeam = homeTeam ?? undefined;
          }

          // Event away team
          if (
            includes.includes(PICK_INCLUDES.EVENT_AWAY_TEAM) &&
            event.awayTeamId
          ) {
            const awayTeam = await this.teamsQueryService.findById(
              event.awayTeamId,
              tx,
            );
            pick.event.awayTeam = awayTeam ?? undefined;
          }

          // Event live score
          if (includes.includes(PICK_INCLUDES.EVENT_LIVE_SCORE)) {
            const liveScore = await this.liveScoresQueryService.findByEventId(
              event.id,
              tx,
            );
            pick.event.liveScore = liveScore ?? undefined;
          }

          // Event outcome
          if (includes.includes(PICK_INCLUDES.EVENT_OUTCOME)) {
            const outcome = await this.outcomesQueryService.findByEventId(
              event.id,
              tx,
            );
            pick.event.outcome = outcome ?? undefined;
          }

          // Event odds and sportsbook
          if (
            includes.includes(PICK_INCLUDES.EVENT_ODDS) ||
            includes.includes(PICK_INCLUDES.EVENT_ODDS_SPORTSBOOK)
          ) {
            const odds = await this.oddsQueryService.findByEventId(
              event.id,
              tx,
            );
            if (odds) {
              pick.event.odds = odds;

              // Include sportsbook if requested
              if (includes.includes(PICK_INCLUDES.EVENT_ODDS_SPORTSBOOK)) {
                const sportsbook = await this.sportsbooksQueryService.findById(
                  odds.sportsbookId,
                  tx,
                );
                if (sportsbook) {
                  pick.event.odds.sportsbook = sportsbook;
                }
              }
            } else {
              pick.event.odds = undefined;
            }
          }
        }
      }
    }
  }
}
