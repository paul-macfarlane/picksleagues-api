import { injectable, inject } from "inversify";
import { db, DBTx } from "../../db/index.js";
import {
  EVENT_TYPES,
  EspnExternalEventMetadataSchema,
  espnStatusToLiveScoreStatus,
} from "./events.types.js";
import {
  ESPNEvent,
  ESPN_SPORT_LEAGUE_GAME_STATUSES,
  ESPN_SPORT_SLUGS,
  ESPN_LEAGUE_SLUGS,
} from "../../integrations/espn/espn.types.js";
import { NotFoundError } from "../../lib/errors.js";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service.js";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types.js";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service.js";
import { SeasonsQueryService } from "../seasons/seasons.query.service.js";
import { PhasesQueryService } from "../phases/phases.query.service.js";
import { TeamsQueryService } from "../teams/teams.query.service.js";
import { EspnService } from "../../integrations/espn/espn.service.js";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service.js";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types.js";
import { OutcomesMutationService } from "../outcomes/outcomes.mutation.service.js";
import { TYPES } from "../../lib/inversify.types.js";
import { EventsQueryService } from "./events.query.service.js";
import { EventsMutationService } from "./events.mutation.service.js";
import { OddsQueryService } from "../odds/odds.query.service.js";
import { OddsMutationService } from "../odds/odds.mutation.service.js";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service.js";
import { LiveScoresMutationService } from "../liveScores/liveScores.mutation.service.js";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service.js";
import {
  DBPhase,
  DBExternalPhase,
  EspnExternalPhaseMetadataSchema,
} from "../phases/phases.types.js";
import { DBSeason } from "../seasons/seasons.types.js";
import pLimit from "p-limit";

@injectable()
export class EventsService {
  constructor(
    @inject(TYPES.EventsQueryService)
    private eventsQueryService: EventsQueryService,
    @inject(TYPES.EventsMutationService)
    private eventsMutationService: EventsMutationService,
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.TeamsQueryService)
    private teamsQueryService: TeamsQueryService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.SportsbooksQueryService)
    private sportsbooksQueryService: SportsbooksQueryService,
    @inject(TYPES.OddsQueryService)
    private oddsQueryService: OddsQueryService,
    @inject(TYPES.OddsMutationService)
    private oddsMutationService: OddsMutationService,
    @inject(TYPES.LiveScoresQueryService)
    private liveScoresQueryService: LiveScoresQueryService,
    @inject(TYPES.LiveScoresMutationService)
    private liveScoresMutationService: LiveScoresMutationService,
    @inject(TYPES.OutcomesQueryService)
    private outcomesQueryService: OutcomesQueryService,
    @inject(TYPES.OutcomesMutationService)
    private outcomesMutationService: OutcomesMutationService,
  ) {}

  private async _prepareSyncData(tx: DBTx) {
    const dataSource = await this.dataSourcesQueryService.findByName(
      DATA_SOURCE_NAMES.ESPN,
      tx,
    );
    if (!dataSource) {
      console.error("ESPN data source not found. Exiting sync.");
      throw new NotFoundError("ESPN data source not found");
    }
    console.log("Data source found.");

    const sportLeagues = await this.sportLeaguesQueryService.list(tx);
    console.log(`Found ${sportLeagues.length} sport leagues to process.`);

    if (sportLeagues.length === 0) {
      return {
        dataSource,
        sportLeagues,
        phasesToProcess: [],
        externalPhases: [],
        seasonsToProcess: [],
        seasonIdToExternalIdMap: new Map(),
        sportLeagueIdToExternalMetadataMap: new Map(),
        externalTeamIdToTeamIdMap: new Map(),
      };
    }

    const externalSportLeagues =
      await this.sportLeaguesQueryService.listExternalBySourceAndSportLeagueIds(
        dataSource.id,
        sportLeagues.map((sl) => sl.id),
        tx,
      );

    const sportLeagueIdToExternalMetadataMap = new Map(
      externalSportLeagues.map((esl) => {
        const parsedMetadata = EspnExternalSportLeagueMetadataSchema.safeParse(
          esl.metadata,
        );
        return [
          esl.sportLeagueId,
          parsedMetadata.success ? parsedMetadata.data : null,
        ];
      }),
    );

    // Seasons
    let seasonsToProcess =
      await this.seasonsQueryService.findCurrentBySportLeagueIds(
        sportLeagues.map((sl) => sl.id),
        tx,
      );
    if (seasonsToProcess.length === 0) {
      seasonsToProcess =
        await this.seasonsQueryService.findLatestBySportLeagueIds(
          sportLeagues.map((sl) => sl.id),
          tx,
        );
      console.log(`Found ${seasonsToProcess.length} latest seasons.`);
    }

    if (seasonsToProcess.length === 0) {
      return {
        dataSource,
        sportLeagues,
        seasonsToProcess,
        phasesToProcess: [],
        externalPhases: [],
        seasonIdToExternalIdMap: new Map(),
        sportLeagueIdToExternalMetadataMap,
        externalTeamIdToTeamIdMap: new Map(),
      };
    }

    const externalSeasons =
      await this.seasonsQueryService.listExternalBySeasonIds(
        seasonsToProcess.map((s) => s.id),
        tx,
      );
    const seasonIdToExternalIdMap = new Map(
      externalSeasons.map((es) => [es.seasonId, es.externalId]),
    );

    // Phases
    let phasesToProcess = await this.phasesQueryService.findCurrentBySeasonIds(
      seasonsToProcess.map((s) => s.id),
      tx,
    );
    console.log(`Found ${phasesToProcess.length} current phases.`);
    if (phasesToProcess.length === 0) {
      console.log(
        "No current phases found. Falling back to next future phases.",
      );
      phasesToProcess = await this.phasesQueryService.findNextBySeasonIds(
        seasonsToProcess.map((s) => s.id),
        tx,
      );
      console.log(`Found ${phasesToProcess.length} next future phases.`);
    }

    if (phasesToProcess.length === 0) {
      return {
        dataSource,
        sportLeagues,
        seasonsToProcess,
        phasesToProcess,
        externalPhases: [],
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
        externalTeamIdToTeamIdMap: new Map(),
      };
    }

    const externalPhases = await this.phasesQueryService.listExternalByPhaseIds(
      phasesToProcess.map((p) => p.id),
      tx,
    );

    // Teams
    const teams = await this.teamsQueryService.listBySportLeagueIds(
      sportLeagues.map((sl) => sl.id),
      tx,
    );
    const externalTeams =
      await this.teamsQueryService.listExternalByDataSourceIdAndTeamIds(
        dataSource.id,
        teams.map((t) => t.id),
        tx,
      );
    const externalTeamIdToTeamIdMap = new Map(
      externalTeams.map((et) => [et.externalId, et.teamId]),
    );

    return {
      dataSource,
      sportLeagues,
      sportLeagueIdToExternalMetadataMap,
      seasonsToProcess,
      seasonIdToExternalIdMap,
      phasesToProcess,
      externalPhases,
      teams,
      externalTeamIdToTeamIdMap,
    };
  }

  private async _fetchEspnEvents(
    externalPhases: DBExternalPhase[],
    phasesToProcess: DBPhase[],
    seasonsToProcess: DBSeason[],
    seasonIdToExternalIdMap: Map<string, string>,
    sportLeagueIdToExternalMetadataMap: Map<
      string,
      { sportSlug: string; leagueSlug: string } | null
    >,
  ) {
    const limit = pLimit(10);
    const eventPromises = externalPhases.map(async (externalPhase) => {
      const phase = phasesToProcess.find((p) => p.id === externalPhase.phaseId);
      if (!phase) return [];

      const season = seasonsToProcess.find((s) => s.id === phase.seasonId);
      if (!season) return [];

      const externalSeasonId = seasonIdToExternalIdMap.get(season.id);
      if (!externalSeasonId) return [];

      const externalSportLeagueMetadata =
        sportLeagueIdToExternalMetadataMap.get(season.sportLeagueId);
      if (!externalSportLeagueMetadata) return [];

      const parsedMetadata = EspnExternalPhaseMetadataSchema.safeParse(
        externalPhase.metadata,
      );
      if (!parsedMetadata.success) return [];

      const events = await limit(() =>
        this.espnService.getESPNEvents(
          externalSportLeagueMetadata.sportSlug as ESPN_SPORT_SLUGS,
          externalSportLeagueMetadata.leagueSlug as ESPN_LEAGUE_SLUGS,
          externalSeasonId,
          parsedMetadata.data.type,
          parsedMetadata.data.number,
        ),
      );

      // Return events with their associated phase information
      return events.map((event) => ({
        event,
        phaseId: phase.id,
      }));
    });

    const espnEventsByPhase = await Promise.all(eventPromises);
    const allEspnEventsWithPhases = espnEventsByPhase.flat();
    console.log(
      `Fetched a total of ${allEspnEventsWithPhases.length} events from ESPN.`,
    );
    return allEspnEventsWithPhases;
  }

  private async _fetchCurrentAndNextPhaseEvents(
    phasesToProcess: DBPhase[],
    externalPhases: DBExternalPhase[],
    seasonsToProcess: DBSeason[],
    seasonIdToExternalIdMap: Map<string, string>,
    sportLeagueIdToExternalMetadataMap: Map<
      string,
      { sportSlug: string; leagueSlug: string } | null
    >,
  ) {
    // Filter external phases to only include current/next phases
    const currentAndNextExternalPhases = externalPhases.filter(
      (externalPhase) =>
        phasesToProcess.some((phase) => phase.id === externalPhase.phaseId),
    );

    return this._fetchEspnEvents(
      currentAndNextExternalPhases,
      phasesToProcess,
      seasonsToProcess,
      seasonIdToExternalIdMap,
      sportLeagueIdToExternalMetadataMap,
    );
  }

  private async _createOrUpdateEvent(
    espnEvent: ESPNEvent,
    dataSourceId: string,
    phaseId: string,
    externalTeamIdToTeamIdMap: Map<string, string>,
    tx: DBTx,
  ) {
    const espnHomeTeam = espnEvent.competitions[0].competitors.find(
      (c) => c.homeAway === "home",
    );
    const espnAwayTeam = espnEvent.competitions[0].competitors.find(
      (c) => c.homeAway === "away",
    );
    if (!espnHomeTeam || !espnAwayTeam)
      return { event: null, status: "skipped" };

    const homeTeamId = externalTeamIdToTeamIdMap.get(espnHomeTeam.id);
    const awayTeamId = externalTeamIdToTeamIdMap.get(espnAwayTeam.id);
    if (!homeTeamId || !awayTeamId) return { event: null, status: "skipped" };

    const externalEvent =
      await this.eventsQueryService.findExternalByDataSourceIdAndExternalId(
        dataSourceId,
        espnEvent.id,
        tx,
      );

    let event;
    let status: "created" | "updated" | "skipped" = "updated";
    if (externalEvent) {
      event = await this.eventsMutationService.update(
        externalEvent.eventId,
        {
          phaseId: phaseId,
          startTime: new Date(espnEvent.competitions[0].date),
          homeTeamId,
          awayTeamId,
        },
        tx,
      );

      await this.eventsMutationService.updateExternal(
        dataSourceId,
        espnEvent.id,
        {
          metadata: {
            oddsRef: espnEvent.competitions[0]?.odds?.$ref,
            awayTeamScoreRef: espnAwayTeam.score?.$ref,
            homeTeamScoreRef: espnHomeTeam.score?.$ref,
            statusRef: espnEvent.competitions[0]?.status?.$ref,
          },
        },
        tx,
      );
    } else {
      status = "created";
      const createdEvent = await this.eventsMutationService.create(
        {
          phaseId: phaseId,
          startTime: new Date(espnEvent.competitions[0].date),
          type: EVENT_TYPES.GAME,
          homeTeamId,
          awayTeamId,
        },
        tx,
      );
      await this.eventsMutationService.createExternal(
        {
          dataSourceId,
          eventId: createdEvent.id,
          externalId: espnEvent.id,
          metadata: {
            oddsRef: espnEvent.competitions[0]?.odds?.$ref,
            awayTeamScoreRef: espnAwayTeam.score?.$ref,
            homeTeamScoreRef: espnHomeTeam.score?.$ref,
            statusRef: espnEvent.competitions[0]?.status?.$ref,
          },
        },
        tx,
      );
      event = createdEvent;
    }
    return { event, status };
  }

  async sync(): Promise<void> {
    console.log("Starting event synchronization...");
    return db.transaction(async (tx) => {
      const dataSource = await this.dataSourcesQueryService.findByName(
        DATA_SOURCE_NAMES.ESPN,
        tx,
      );
      if (!dataSource) {
        console.error("ESPN data source not found. Exiting sync.");
        throw new NotFoundError("ESPN data source not found");
      }
      console.log("Data source found.");

      const sportLeagues = await this.sportLeaguesQueryService.list(tx);
      console.log(`Found ${sportLeagues.length} sport leagues to process.`);
      if (sportLeagues.length === 0) {
        console.log("No sport leagues found. Exiting sync.");
        return;
      }

      const externalSportLeagues =
        await this.sportLeaguesQueryService.listExternalBySourceAndSportLeagueIds(
          dataSource.id,
          sportLeagues.map((sl) => sl.id),
          tx,
        );

      const sportLeagueIdToExternalMetadataMap = new Map(
        externalSportLeagues.map((esl) => {
          const parsedMetadata =
            EspnExternalSportLeagueMetadataSchema.safeParse(esl.metadata);
          if (!parsedMetadata.success) {
            console.warn(
              `Invalid external sport league metadata for sportLeagueId: ${esl.sportLeagueId}. Skipping.`,
            );
          }
          return [
            esl.sportLeagueId,
            parsedMetadata.success ? parsedMetadata.data : null,
          ];
        }),
      );

      let seasonsToProcess =
        await this.seasonsQueryService.findCurrentBySportLeagueIds(
          sportLeagues.map((sl) => sl.id),
          tx,
        );
      console.log(`Found ${seasonsToProcess.length} current seasons.`);

      if (seasonsToProcess.length === 0) {
        console.log(
          "No current seasons found. Falling back to latest seasons.",
        );
        seasonsToProcess =
          await this.seasonsQueryService.findLatestBySportLeagueIds(
            sportLeagues.map((sl) => sl.id),
            tx,
          );
        console.log(`Found ${seasonsToProcess.length} latest seasons.`);
      }

      if (seasonsToProcess.length === 0) {
        console.log("No seasons found. Exiting sync.");
      }

      const externalSeasons =
        await this.seasonsQueryService.listExternalBySeasonIds(
          seasonsToProcess.map((s) => s.id),
          tx,
        );

      const seasonIdToExternalIdMap = new Map(
        externalSeasons.map((es) => [es.seasonId, es.externalId]),
      );

      const allPhases = await this.phasesQueryService.listBySeasonIds(
        seasonsToProcess.map((s) => s.id),
        tx,
      );

      const futurePhases = allPhases.filter(
        (phase) => phase.startDate && new Date(phase.startDate) > new Date(),
      );
      console.log(`Found ${futurePhases.length} future phases.`);
      if (futurePhases.length === 0) {
        console.log("No future phases found. Exiting sync.");
        return;
      }

      const futureExternalPhases =
        await this.phasesQueryService.listExternalByPhaseIds(
          futurePhases.map((p) => p.id),
          tx,
        );

      const teams = await this.teamsQueryService.listBySportLeagueIds(
        sportLeagues.map((sl) => sl.id),
        tx,
      );

      const externalTeams =
        await this.teamsQueryService.listExternalByDataSourceIdAndTeamIds(
          dataSource.id,
          teams.map((t) => t.id),
          tx,
        );

      const externalTeamIdToTeamIdMap = new Map(
        externalTeams.map((et) => [et.externalId, et.teamId]),
      );

      const existingExternalEvents =
        await this.eventsQueryService.listExternalByDataSourceId(
          dataSource.id,
          tx,
        );
      console.log(
        `Found ${existingExternalEvents.length} existing external events.`,
      );

      const allEspnEvents = await this._fetchEspnEvents(
        futureExternalPhases,
        futurePhases,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
      );

      const futureEspnEvents = allEspnEvents.filter(
        (event) =>
          event.event.competitions[0]?.date &&
          new Date(event.event.competitions[0].date) > new Date(),
      );
      console.log(`Found ${futureEspnEvents.length} future events from ESPN.`);

      console.log("Processing future ESPN events...");
      let createdEventsCount = 0;
      let updatedEventsCount = 0;

      for (const espnEvent of futureEspnEvents) {
        const { status } = await this._createOrUpdateEvent(
          espnEvent.event,
          dataSource.id,
          espnEvent.phaseId,
          externalTeamIdToTeamIdMap,
          tx,
        );

        if (status === "created") createdEventsCount++;
        if (status === "updated") updatedEventsCount++;
      }

      console.log(`Processed ${futureEspnEvents.length} events:`);
      console.log(`  - Created: ${createdEventsCount} events`);
      console.log(`  - Updated: ${updatedEventsCount} events`);
      console.log("Event synchronization finished successfully.");
    });
  }

  async syncWithOdds(): Promise<void> {
    console.log("Starting event synchronization with odds...");
    return db.transaction(async (tx) => {
      const {
        dataSource,
        phasesToProcess,
        externalPhases,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
        externalTeamIdToTeamIdMap,
      } = await this._prepareSyncData(tx);

      if (phasesToProcess.length === 0) {
        console.log("No phases to process. Exiting sync.");
        return;
      }

      const allEspnEvents = await this._fetchCurrentAndNextPhaseEvents(
        phasesToProcess,
        externalPhases,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
      );

      console.log(
        `Processing ${allEspnEvents.length} events for current/next phases...`,
      );

      let createdEventsCount = 0;
      let updatedEventsCount = 0;
      let createdOddsCount = 0;
      let updatedOddsCount = 0;
      let createdExternalOddsCount = 0;
      let updatedExternalOddsCount = 0;

      for (const espnEvent of allEspnEvents) {
        const { event, status } = await this._createOrUpdateEvent(
          espnEvent.event,
          dataSource.id,
          espnEvent.phaseId,
          externalTeamIdToTeamIdMap,
          tx,
        );

        if (status === "created") createdEventsCount++;
        if (status === "updated") updatedEventsCount++;
        if (!event) continue;

        const defaultSportsbook =
          await this.sportsbooksQueryService.findDefault(tx);
        if (!defaultSportsbook) {
          console.warn("No default sportsbook found. Skipping odds sync.");
          continue;
        }

        const externalDefaultSportsbook =
          await this.sportsbooksQueryService.findExternalByDataSourceIdAndSportsbookId(
            dataSource.id,
            defaultSportsbook.id,
            tx,
          );
        if (!externalDefaultSportsbook) {
          console.warn(
            "No external default sportsbook found. Skipping odds sync.",
          );
          continue;
        }

        if (espnEvent.event.competitions[0]?.odds?.$ref) {
          const espnOdds = await this.espnService.getESPNEventOdds(
            espnEvent.event.competitions[0].odds.$ref,
          );
          const defaultOdd = espnOdds.find(
            (o) => o.provider.id === externalDefaultSportsbook.externalId,
          );

          if (defaultOdd) {
            const existingOdds = await this.oddsQueryService.findByEventId(
              event.id,
              tx,
            );

            // Determine which team is the favorite based on the odds
            const homeTeamIsFavorite = defaultOdd.homeTeamOdds.favorite;
            const spreadValue = defaultOdd.spread;

            // Calculate spread for home and away teams
            // If home team is favorite, they give points (negative spread)
            // If away team is favorite, they give points (positive spread)
            const spreadHome = homeTeamIsFavorite ? spreadValue : -spreadValue;
            const spreadAway = homeTeamIsFavorite ? -spreadValue : spreadValue;

            console.log(
              `Event ${event.id}: Spread ${spreadValue}, Home favorite: ${homeTeamIsFavorite}, Home spread: ${spreadHome}, Away spread: ${spreadAway}`,
            );

            const oddsData = {
              eventId: event.id,
              sportsbookId: defaultSportsbook.id,
              spreadHome: spreadHome.toString(),
              spreadAway: spreadAway.toString(),
              moneylineHome: defaultOdd.homeTeamOdds.moneyLine,
              moneylineAway: defaultOdd.awayTeamOdds.moneyLine,
              total: defaultOdd.overUnder.toString(),
            };
            let odds;
            if (existingOdds) {
              odds = await this.oddsMutationService.update(
                existingOdds.id,
                oddsData,
                tx,
              );
              updatedOddsCount++;
            } else {
              odds = await this.oddsMutationService.create(oddsData, tx);
              createdOddsCount++;
            }
            const existingExternalOdds =
              await this.oddsQueryService.findExternalByDataSourceIdAndExternalId(
                dataSource.id,
                defaultOdd.$ref,
                tx,
              );
            if (!existingExternalOdds) {
              await this.oddsMutationService.createExternal(
                {
                  dataSourceId: dataSource.id,
                  externalId: defaultOdd.$ref,
                  oddsId: odds.id,
                },
                tx,
              );
              createdExternalOddsCount++;
            } else {
              await this.oddsMutationService.updateExternal(
                dataSource.id,
                defaultOdd.$ref,
                { oddsId: odds.id },
                tx,
              );
              updatedExternalOddsCount++;
            }
          }
        }
      }

      console.log(`Processed ${allEspnEvents.length} events:`);
      console.log(`  - Created: ${createdEventsCount} events`);
      console.log(`  - Updated: ${updatedEventsCount} events`);
      console.log(`  - Created: ${createdOddsCount} odds records`);
      console.log(`  - Updated: ${updatedOddsCount} odds records`);
      console.log(
        `  - Created: ${createdExternalOddsCount} external odds records`,
      );
      console.log(
        `  - Updated: ${updatedExternalOddsCount} external odds records`,
      );

      console.log("Event synchronization with odds finished successfully.");
    });
  }

  async syncWithLiveScores(): Promise<void> {
    console.log("Starting live score synchronization...");
    return db.transaction(async (tx) => {
      const {
        dataSource,
        phasesToProcess,
        externalPhases,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
        externalTeamIdToTeamIdMap,
      } = await this._prepareSyncData(tx);

      if (phasesToProcess.length === 0) {
        console.log("No phases to process. Exiting sync.");
        return;
      }

      const allEspnEvents = await this._fetchCurrentAndNextPhaseEvents(
        phasesToProcess,
        externalPhases,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
      );

      console.log(
        `Processing ${allEspnEvents.length} events for current/next phases...`,
      );

      let createdEventsCount = 0;
      let updatedEventsCount = 0;
      let createdLiveScores = 0;
      let updatedLiveScores = 0;
      let createdOutcomes = 0;
      let updatedOutcomes = 0;

      for (const espnEvent of allEspnEvents) {
        const { event, status: eventStatus } = await this._createOrUpdateEvent(
          espnEvent.event,
          dataSource.id,
          espnEvent.phaseId,
          externalTeamIdToTeamIdMap,
          tx,
        );

        if (eventStatus === "created") createdEventsCount++;
        if (eventStatus === "updated") updatedEventsCount++;
        if (!event) continue;

        const updatedExternalEvent =
          await this.eventsQueryService.findExternalByDataSourceIdAndEventId(
            dataSource.id,
            event.id,
            tx,
          );

        if (!updatedExternalEvent) continue;

        const externalEventMetadata = EspnExternalEventMetadataSchema.safeParse(
          updatedExternalEvent.metadata,
        );
        if (!externalEventMetadata.success) continue;

        const { homeTeamScoreRef, awayTeamScoreRef, statusRef } =
          externalEventMetadata.data;
        if (!homeTeamScoreRef || !awayTeamScoreRef || !statusRef) continue;

        const [homeTeamScore, awayTeamScore, status] = await Promise.all([
          this.espnService.getESPNEventScore(homeTeamScoreRef),
          this.espnService.getESPNEventScore(awayTeamScoreRef),
          this.espnService.getESPNEventStatusFromRefUrl(statusRef),
        ]);

        const liveScoreData = {
          eventId: event.id,
          homeScore: homeTeamScore.value,
          awayScore: awayTeamScore.value,
          status: espnStatusToLiveScoreStatus[status.type.name],
          period: status.period,
          clock: status.displayClock,
        };

        const existingLiveScore =
          await this.liveScoresQueryService.findByEventId(event.id, tx);
        if (existingLiveScore) {
          await this.liveScoresMutationService.update(
            event.id,
            liveScoreData,
            tx,
          );
          updatedLiveScores++;
        } else {
          await this.liveScoresMutationService.create(liveScoreData, tx);
          createdLiveScores++;
        }

        if (status.type.name === ESPN_SPORT_LEAGUE_GAME_STATUSES.FINAL) {
          const existingOutcome = await this.outcomesQueryService.findByEventId(
            event.id,
            tx,
          );
          if (!existingOutcome) {
            await this.outcomesMutationService.create(
              {
                eventId: event.id,
                homeScore: homeTeamScore.value,
                awayScore: awayTeamScore.value,
              },
              tx,
            );
            createdOutcomes++;
          } else {
            await this.outcomesMutationService.update(
              event.id,
              {
                homeScore: homeTeamScore.value,
                awayScore: awayTeamScore.value,
              },
              tx,
            );
            updatedOutcomes++;
          }
        }
      }
      console.log(`Processed ${allEspnEvents.length} events:`);
      console.log(`  - Created: ${createdEventsCount} events`);
      console.log(`  - Updated: ${updatedEventsCount} events`);
      console.log(`  - Created: ${createdLiveScores} live scores`);
      console.log(`  - Updated: ${updatedLiveScores} live scores`);
      console.log(`  - Created: ${createdOutcomes} outcomes`);
      console.log(`  - Updated: ${updatedOutcomes} outcomes`);
      console.log("Live score synchronization finished successfully.");
    });
  }
}
