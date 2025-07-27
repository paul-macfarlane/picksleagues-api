import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { PicksQueryService } from "./picks.query.service.js";
import { EventsQueryService } from "../events/events.query.service.js";
import { ProfilesQueryService } from "../profiles/profiles.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { PhasesUtilService } from "../phases/phases.util.service.js";
import { ForbiddenError } from "../../lib/errors.js";
import { db } from "../../db/index.js";
import { PopulatedPick, PICK_INCLUDES, DBPick } from "./picks.types.js";
import { DBOrTx } from "../../db/index.js";

@injectable()
export class PicksService {
  constructor(
    @inject(TYPES.PicksQueryService)
    private picksQueryService: PicksQueryService,
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
    @inject(TYPES.PhasesUtilService)
    private phasesUtilService: PhasesUtilService,
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

      // Get events for the phase
      const events = await this.eventsQueryService.listByPhaseIds(
        [phaseId],
        tx,
      );
      if (events.length === 0) {
        return [];
      }

      // Get all picks for this league that match the events in the phase
      const eventIds = events.map((event) => event.id);
      const allPicks = await this.picksQueryService.findByLeagueIdAndEventIds(
        leagueId,
        eventIds,
        tx,
      );

      // Populate includes
      const populatedPicks: PopulatedPick[] = allPicks.map((pick: DBPick) => ({
        ...pick,
      }));

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
    // Get the current phase for the league
    const currentPhase = await this.phasesUtilService.getCurrentPhaseForLeague(
      userId,
      leagueId,
    );

    // Get picks for the user in the current phase
    return this.getPicksForUserInPhase(
      userId,
      leagueId,
      currentPhase.id,
      includes,
    );
  }

  async getAllPicksForCurrentPhase(
    userId: string,
    leagueId: string,
    includes?: string[],
  ): Promise<PopulatedPick[]> {
    // Get the current phase for the league
    const currentPhase = await this.phasesUtilService.getCurrentPhaseForLeague(
      userId,
      leagueId,
    );

    // Get all picks for the current phase
    return this.getAllPicksForLeagueAndPhase(
      userId,
      leagueId,
      currentPhase.id,
      includes,
    );
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
