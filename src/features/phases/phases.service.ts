import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { db } from "../../db/index.js";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types.js";
import { ESPN_SEASON_TYPES } from "../../integrations/espn/espn.types.js";
import { PhasesQueryService } from "./phases.query.service.js";
import { PhasesMutationService } from "./phases.mutation.service.js";
import { PhaseTemplatesQueryService } from "../phaseTemplates/phaseTemplates.query.service.js";
import { PhasesUtilService } from "./phases.util.service.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types.js";
import { SeasonsUtilService } from "../seasons/seasons.util.service.js";
import { EspnExternalSeasonMetadataSchema } from "../seasons/seasons.types.js";
import { EventsQueryService } from "../events/events.query.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import { LeaguesQueryService } from "../leagues/leagues.query.service.js";
import { LeagueMembersQueryService } from "../leagueMembers/leagueMembers.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { PopulatedPhase, PHASE_INCLUDES } from "./phases.types.js";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

@injectable()
export class PhasesService {
  constructor(
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.PhasesMutationService)
    private phasesMutationService: PhasesMutationService,
    @inject(TYPES.PhaseTemplatesQueryService)
    private phaseTemplatesQueryService: PhaseTemplatesQueryService,
    @inject(TYPES.PhasesUtilService)
    private phasesUtilService: PhasesUtilService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
    @inject(TYPES.SeasonsUtilService)
    private seasonsUtilService: SeasonsUtilService,
    @inject(TYPES.EventsQueryService)
    private eventsQueryService: EventsQueryService,
    @inject(TYPES.LiveScoresQueryService)
    private liveScoresQueryService: LiveScoresQueryService,
    @inject(TYPES.OddsQueryService)
    private oddsQueryService: OddsQueryService,
    @inject(TYPES.SportsbooksQueryService)
    private sportsbooksQueryService: SportsbooksQueryService,
    @inject(TYPES.OutcomesQueryService)
    private outcomesQueryService: OutcomesQueryService,
    @inject(TYPES.LeaguesQueryService)
    private leaguesQueryService: LeaguesQueryService,
    @inject(TYPES.LeagueMembersQueryService)
    private leagueMembersQueryService: LeagueMembersQueryService,
    @inject(TYPES.TeamsQueryService)
    private teamsQueryService: TeamsQueryService,
  ) {}

  /**
   * Calculate pick lock time for a phase based on its type
   * Regular season phases: Sunday at 1PM ET
   * Postseason phases: Saturday at 1PM ET
   */
  private calculatePickLockTime(
    startDate: Date,
    phaseType: ESPN_SEASON_TYPES,
  ): Date {
    const startDateObj = new Date(startDate);

    // For regular season, set to Sunday at 1PM ET
    if (phaseType === ESPN_SEASON_TYPES.REGULAR_SEASON) {
      // Find the next Sunday after the start date
      const daysUntilSunday = (7 - startDateObj.getDay()) % 7;
      const sundayDate = new Date(startDateObj);
      sundayDate.setDate(startDateObj.getDate() + daysUntilSunday);

      // Set to 1PM Eastern Time using timezone library
      const easternTime = toZonedTime(sundayDate, "America/New_York");
      easternTime.setHours(13, 0, 0, 0); // 1PM ET

      // Convert back to UTC for storage
      return fromZonedTime(easternTime, "America/New_York");
    }

    // For postseason, set to Saturday at 1PM ET
    if (phaseType === ESPN_SEASON_TYPES.POST_SEASON) {
      // Find the next Saturday after the start date
      const daysUntilSaturday = (6 - startDateObj.getDay() + 7) % 7;
      const saturdayDate = new Date(startDateObj);
      saturdayDate.setDate(startDateObj.getDate() + daysUntilSaturday);

      // Set to 1PM Eastern Time using timezone library
      const easternTime = toZonedTime(saturdayDate, "America/New_York");
      easternTime.setHours(13, 0, 0, 0); // 1PM ET

      // Convert back to UTC for storage
      return fromZonedTime(easternTime, "America/New_York");
    }

    // Default fallback
    return startDateObj;
  }

  async syncPhases() {
    return db.transaction(async (tx) => {
      const dataSource = await this.dataSourcesQueryService.findByName(
        DATA_SOURCE_NAMES.ESPN,
        tx,
      );
      if (!dataSource) {
        throw new NotFoundError("ESPN data source not found");
      }

      const sportLeagues = await this.sportLeaguesQueryService.list(tx);
      console.log(`Found ${sportLeagues.length} sport leagues`);

      for (const sportLeague of sportLeagues) {
        const externalSportLeague =
          await this.sportLeaguesQueryService.findExternalBySourceAndSportLeagueId(
            dataSource.id,
            sportLeague.id,
            tx,
          );
        if (!externalSportLeague) {
          console.error(
            `External sport league not found for ${sportLeague.id}`,
          );
          continue;
        }

        const parsedExternalSportLeagueMetadata =
          EspnExternalSportLeagueMetadataSchema.safeParse(
            externalSportLeague.metadata,
          );
        if (!parsedExternalSportLeagueMetadata.success) {
          console.error(
            `Invalid metadata for ${sportLeague.id}: ${parsedExternalSportLeagueMetadata.error}`,
          );
          continue;
        }

        const season =
          await this.seasonsUtilService.findCurrentOrLatestSeasonForSportLeagueId(
            sportLeague.id,
            tx,
          );
        if (!season) {
          console.error(`Latest season not found for ${sportLeague.id}`);
          continue;
        }

        const externalSeason =
          await this.seasonsQueryService.findExternalBySourceAndSeasonId(
            dataSource.id,
            season.id,
            tx,
          );
        if (!externalSeason) {
          console.error(`External season not found for ${season.id}`);
          continue;
        }

        const parsedExternalSeasonMetadata =
          EspnExternalSeasonMetadataSchema.safeParse(externalSeason.metadata);
        if (!parsedExternalSeasonMetadata.success) {
          console.error(
            `Invalid metadata for ${season.id}: ${parsedExternalSeasonMetadata.error}`,
          );
          continue;
        }

        const regularSeasonESPNWeeks = await this.espnService.getESPNWeeks(
          parsedExternalSportLeagueMetadata.data.sportSlug,
          parsedExternalSportLeagueMetadata.data.leagueSlug,
          parsedExternalSeasonMetadata.data.slug,
          ESPN_SEASON_TYPES.REGULAR_SEASON,
        );

        const postSeasonESPNWeeks = await this.espnService.getESPNWeeks(
          parsedExternalSportLeagueMetadata.data.sportSlug,
          parsedExternalSportLeagueMetadata.data.leagueSlug,
          parsedExternalSeasonMetadata.data.slug,
          ESPN_SEASON_TYPES.POST_SEASON,
        );

        const espnWeeks = [
          ...regularSeasonESPNWeeks.map((week) => ({
            ...week,
            type: ESPN_SEASON_TYPES.REGULAR_SEASON,
          })),
          ...postSeasonESPNWeeks
            .filter((week) => week.text !== "Pro Bowl")
            .map((week) => ({
              ...week,
              type: ESPN_SEASON_TYPES.POST_SEASON,
            })),
        ];

        for (const [index, espnWeek] of espnWeeks.entries()) {
          const externalMetadata = {
            type: espnWeek.type,
            number: espnWeek.number,
          };

          const existingExternalPhase =
            await this.phasesQueryService.findExternalBySourceAndExternalId(
              dataSource.id,
              espnWeek.$ref,
              tx,
            );
          if (existingExternalPhase) {
            console.log(
              `${espnWeek.$ref} already exists for season ${externalSeason.seasonId}`,
            );

            const pickLockTime = this.calculatePickLockTime(
              new Date(espnWeek.startDate),
              espnWeek.type,
            );

            const updatedPhase = await this.phasesMutationService.update(
              existingExternalPhase.phaseId,
              {
                sequence: index + 1,
                startDate: new Date(espnWeek.startDate),
                endDate: new Date(espnWeek.endDate),
                pickLockTime,
              },
              tx,
            );

            console.log(`Updated phase ${JSON.stringify(updatedPhase)}`);

            const updatedExternalPhase =
              await this.phasesMutationService.updateExternal(
                dataSource.id,
                existingExternalPhase.externalId,
                {
                  phaseId: updatedPhase.id,
                  metadata: externalMetadata,
                },
                tx,
              );

            console.log(
              `Updated external phase ${JSON.stringify(updatedExternalPhase)}`,
            );
          } else {
            console.log(
              `${espnWeek.text} does not exist for season ${externalSeason.seasonId}`,
            );

            const phaseTemplate =
              await this.phaseTemplatesQueryService.findBySportLeagueAndLabel(
                externalSportLeague.sportLeagueId,
                espnWeek.text,
                tx,
              );
            if (!phaseTemplate) {
              console.warn(`Phase template not found for ${espnWeek.text}`);
              continue;
            }

            const pickLockTime = this.calculatePickLockTime(
              new Date(espnWeek.startDate),
              espnWeek.type,
            );

            const insertedPhase = await this.phasesMutationService.create(
              {
                seasonId: externalSeason.seasonId,
                phaseTemplateId: phaseTemplate.id,
                sequence: index + 1,
                startDate: new Date(espnWeek.startDate),
                endDate: new Date(espnWeek.endDate),
                pickLockTime,
              },
              tx,
            );

            console.log(`Inserting phase ${JSON.stringify(insertedPhase)}`);

            const insertedExternalPhase =
              await this.phasesMutationService.createExternal(
                {
                  dataSourceId: dataSource.id,
                  externalId: espnWeek.$ref, // the closest thing to a unique id
                  phaseId: insertedPhase.id,
                  metadata: externalMetadata,
                },
                tx,
              );

            console.log(
              `Inserted external phase ${JSON.stringify(insertedExternalPhase)}`,
            );
          }
        }
      }
    });
  }

  async getCurrentPhaseForLeague(
    userId: string,
    leagueId: string,
    includes?: string[],
  ): Promise<PopulatedPhase> {
    // Use the util service to get the current phase ID
    const { id: phaseId } =
      await this.phasesUtilService.getCurrentOrNextPhaseForLeagueForUser(
        userId,
        leagueId,
      );

    // Get the full phase data
    const phase = await this.phasesQueryService.findById(phaseId);
    if (!phase) {
      throw new NotFoundError("Phase not found");
    }

    const result: PopulatedPhase = phase;

    // Get the league for context (needed for previous/next phase includes)
    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    // Handle includes
    if (includes) {
      await this._populatePhaseIncludes(result, includes, {
        startPhaseTemplateId: league.startPhaseTemplateId,
        endPhaseTemplateId: league.endPhaseTemplateId,
      });
    }

    return result;
  }

  async getPhaseByIdAndLeagueId(
    userId: string,
    phaseId: string,
    leagueId: string,
    includes?: string[],
  ): Promise<PopulatedPhase> {
    // Get the phase
    const phase = await this.phasesQueryService.findById(phaseId);
    if (!phase) {
      throw new NotFoundError("Phase not found");
    }

    // Get the league to verify user membership
    const league = await this.leaguesQueryService.findById(leagueId);
    if (!league) {
      throw new NotFoundError("League not found");
    }

    // Verify user is a member of the league
    const member = await this.leagueMembersQueryService.findByLeagueAndUserId(
      league.id,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("You are not a member of this league");
    }

    const result: PopulatedPhase = phase;

    // Handle includes (only events-related includes for individual phase)
    if (includes) {
      await this._populatePhaseIncludes(result, includes, {
        startPhaseTemplateId: league.startPhaseTemplateId,
        endPhaseTemplateId: league.endPhaseTemplateId,
      });
    }

    return result;
  }

  private async _populatePhaseIncludes(
    phase: PopulatedPhase,
    includes: string[],
    leagueContext?: {
      startPhaseTemplateId: string;
      endPhaseTemplateId: string;
    },
  ): Promise<void> {
    // Phase template
    if (includes.includes(PHASE_INCLUDES.PHASE_TEMPLATE)) {
      const phaseTemplate = await this.phaseTemplatesQueryService.findById(
        phase.phaseTemplateId,
      );
      phase.phaseTemplate = phaseTemplate ?? undefined;
    }

    if (
      leagueContext &&
      (includes.includes(PHASE_INCLUDES.PREVIOUS_PHASE) ||
        includes.includes(PHASE_INCLUDES.NEXT_PHASE))
    ) {
      if (includes.includes(PHASE_INCLUDES.PREVIOUS_PHASE)) {
        const previousPhase = await this.phasesQueryService.findPreviousPhase(
          phase.id,
          leagueContext.startPhaseTemplateId,
          leagueContext.endPhaseTemplateId,
        );
        phase.previousPhase = previousPhase ?? undefined;
      }

      if (includes.includes(PHASE_INCLUDES.NEXT_PHASE)) {
        const nextPhase = await this.phasesQueryService.findNextPhase(
          phase.id,
          leagueContext.startPhaseTemplateId,
          leagueContext.endPhaseTemplateId,
        );
        phase.nextPhase = nextPhase ?? undefined;
      }
    }

    // Events
    if (includes.includes(PHASE_INCLUDES.EVENTS)) {
      const events = await this.eventsQueryService.listByPhaseIds([phase.id]);

      phase.events = events.map((event) => ({
        id: event.id,
        phaseId: event.phaseId,
        startTime: event.startTime,
        type: event.type,
        homeTeamId: event.homeTeamId,
        awayTeamId: event.awayTeamId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }));

      // Handle nested includes for events
      // Live scores and outcomes for events
      if (
        includes.includes(PHASE_INCLUDES.EVENTS_LIVE_SCORES) ||
        includes.includes(PHASE_INCLUDES.EVENTS_OUTCOMES)
      ) {
        for (const event of phase.events!) {
          if (includes.includes(PHASE_INCLUDES.EVENTS_LIVE_SCORES)) {
            const liveScore = await this.liveScoresQueryService.findByEventId(
              event.id,
            );
            event.liveScore = liveScore ?? undefined;
          }

          if (includes.includes(PHASE_INCLUDES.EVENTS_OUTCOMES)) {
            const outcome = await this.outcomesQueryService.findByEventId(
              event.id,
            );
            event.outcome = outcome ?? undefined;
          }
        }
      }

      // Odds and sportsbooks for events
      if (
        includes.includes(PHASE_INCLUDES.EVENTS_ODDS) ||
        includes.includes(PHASE_INCLUDES.EVENTS_ODDS_SPORTSBOOK)
      ) {
        for (const event of phase.events!) {
          if (includes.includes(PHASE_INCLUDES.EVENTS_ODDS)) {
            const odds = await this.oddsQueryService.findByEventId(event.id);
            if (odds) {
              event.odds = odds;

              // Include sportsbook if requested
              if (includes.includes(PHASE_INCLUDES.EVENTS_ODDS_SPORTSBOOK)) {
                const sportsbook = await this.sportsbooksQueryService.findById(
                  odds.sportsbookId,
                );
                if (sportsbook) {
                  event.odds.sportsbook = sportsbook;
                }
              }
            } else {
              event.odds = undefined;
            }
          }
        }
      }

      // Teams for events
      if (
        includes.includes(PHASE_INCLUDES.EVENTS_HOME_TEAM) ||
        includes.includes(PHASE_INCLUDES.EVENTS_AWAY_TEAM)
      ) {
        for (const event of phase.events!) {
          if (
            includes.includes(PHASE_INCLUDES.EVENTS_HOME_TEAM) &&
            event.homeTeamId
          ) {
            const homeTeam = await this.teamsQueryService.findById(
              event.homeTeamId,
            );
            event.homeTeam = homeTeam ?? undefined;
          }

          if (
            includes.includes(PHASE_INCLUDES.EVENTS_AWAY_TEAM) &&
            event.awayTeamId
          ) {
            const awayTeam = await this.teamsQueryService.findById(
              event.awayTeamId,
            );
            event.awayTeam = awayTeam ?? undefined;
          }
        }
      }
    }
  }
}
