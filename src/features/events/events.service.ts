import { injectable, inject } from "inversify";
import { db, DBTx } from "../../db";
import {
  EVENT_TYPES,
  EspnExternalEventMetadataSchema,
  espnStatusToLiveScoreStatus,
  DBEventInsert,
  DBEventUpdate,
  DBExternalEventUpdate,
  DBExternalEventInsert,
} from "./events.types";
import {
  ESPNEvent,
  ESPNSeasonType,
  ESPN_SPORT_LEAGUE_GAME_STATUSES,
  ESPN_SPORT_SLUGS,
  ESPN_LEAGUE_SLUGS,
} from "../../integrations/espn/espn.types";
import axios from "axios";
import { NotFoundError } from "../../lib/errors";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service";
import { SeasonsQueryService } from "../seasons/seasons.query.service";
import { PhasesQueryService } from "../phases/phases.query.service";
import { TeamsQueryService } from "../teams/teams.query.service";
import { EspnService } from "../../integrations/espn/espn.service";
import { SportsbooksQueryService } from "../sportsbooks/sportsbooks.query.service";
import { EspnExternalPhaseMetadataSchema } from "../phases/phase.types";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types";
import { OutcomesMutationService } from "../outcomes/outcomes.mutation.service";
import { TYPES } from "../../lib/inversify.types";
import { EventsQueryService } from "./events.query.service";
import { EventsMutationService } from "./events.mutation.service";
import { OddsQueryService } from "../odds/odds.query.service";
import { OddsMutationService } from "../odds/odds.mutation.service";
import { LiveScoresQueryService } from "../liveScores/liveScores.query.service";
import { LiveScoresMutationService } from "../liveScores/liveScores.mutation.service";
import { OutcomesQueryService } from "../outcomes/outcomes.query.service";
import { DBPhase, DBExternalPhase } from "../phases/phase.types";
import { DBSeason } from "../seasons/seasons.types";

@injectable()
export class EventsService {
  private limit: (
    concurrency: number,
  ) => <T>(fn: () => Promise<T>) => Promise<T>;

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
  ) {
    this.limit = () => (fn) => fn();
    import("p-limit").then((pLimit) => {
      this.limit = pLimit.default;
    });
  }

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
    const limit = this.limit(10);
    const eventPromises = externalPhases.map((externalPhase) => {
      const phase = phasesToProcess.find((p) => p.id === externalPhase.phaseId);
      if (!phase) return Promise.resolve([]);

      const season = seasonsToProcess.find((s) => s.id === phase.seasonId);
      if (!season) return Promise.resolve([]);

      const externalSeasonId = seasonIdToExternalIdMap.get(season.id);
      if (!externalSeasonId) return Promise.resolve([]);

      const externalSportLeagueMetadata =
        sportLeagueIdToExternalMetadataMap.get(season.sportLeagueId);
      if (!externalSportLeagueMetadata) return Promise.resolve([]);

      const parsedMetadata = EspnExternalPhaseMetadataSchema.safeParse(
        externalPhase.metadata,
      );
      if (!parsedMetadata.success) return Promise.resolve([]);

      return limit(() =>
        this.espnService.getESPNEvents(
          externalSportLeagueMetadata.sportSlug as ESPN_SPORT_SLUGS,
          externalSportLeagueMetadata.leagueSlug as ESPN_LEAGUE_SLUGS,
          externalSeasonId,
          parsedMetadata.data.type,
          parsedMetadata.data.number,
        ),
      );
    });

    const espnEventsByPhase = await Promise.all(eventPromises);
    const allEspnEvents: ESPNEvent[] = espnEventsByPhase.flat();
    console.log(`Fetched a total of ${allEspnEvents.length} events from ESPN.`);
    return allEspnEvents;
  }

  private async _createOrUpdateEvent(
    espnEvent: ESPNEvent,
    dataSourceId: string,
    phasesToProcess: DBPhase[],
    externalPhases: DBExternalPhase[],
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

    const seasonTypeResponse = await axios.get<ESPNSeasonType>(
      espnEvent.seasonType.$ref.replace("http://", "https://"),
    );
    const espnSeasonType = seasonTypeResponse.data;

    const phase = phasesToProcess.find((p) => {
      const externalPhase = externalPhases.find((ep) => ep.phaseId === p.id);
      if (!externalPhase) return false;
      const metadata = EspnExternalPhaseMetadataSchema.safeParse(
        externalPhase.metadata,
      );
      if (!metadata.success) return false;
      return espnSeasonType.type === metadata.data.type;
    });
    if (!phase) return { event: null, status: "skipped" };

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
          phaseId: phase.id,
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
      const existingExternalEventIds = new Set(
        existingExternalEvents.map((ee) => ee.externalId),
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
          event.competitions[0]?.date &&
          new Date(event.competitions[0].date) > new Date(),
      );
      console.log(`Found ${futureEspnEvents.length} future events from ESPN.`);

      // Pre-fetch all unique season types in parallel to avoid serial requests in the loop.
      const uniqueSeasonTypeRefs = [
        ...new Set(futureEspnEvents.map((event) => event.seasonType.$ref)),
      ];
      console.log(
        `Found ${uniqueSeasonTypeRefs.length} unique season type refs to fetch.`,
      );

      const limit = this.limit(10);
      const seasonTypePromises = uniqueSeasonTypeRefs.map((ref) =>
        limit(() =>
          axios
            .get<ESPNSeasonType>(ref.replace("http://", "https://"))
            .catch((err) => {
              console.error(
                `Failed to fetch season type from ${ref}:`,
                err.message,
              );
              return null; // Return null on error to not break Promise.all
            }),
        ),
      );

      const seasonTypeResponses = await Promise.all(seasonTypePromises);
      const seasonTypeMap = new Map<string, ESPNSeasonType>();
      seasonTypeResponses.forEach((response, index) => {
        if (response) {
          seasonTypeMap.set(uniqueSeasonTypeRefs[index], response.data);
        }
      });
      console.log(
        `Successfully fetched ${seasonTypeMap.size} unique season types.`,
      );

      const eventsToCreate: DBEventInsert[] = [];
      const newEspnEventsForExternalCreation: ESPNEvent[] = [];
      const eventsToUpdate: (DBEventUpdate & { id: string })[] = [];
      const externalEventsToUpdate: (DBExternalEventUpdate & {
        externalId: string;
      })[] = [];

      console.log("Processing future ESPN events...");
      for (const espnEvent of futureEspnEvents) {
        const homeTeam = espnEvent.competitions[0].competitors.find(
          (c) => c.homeAway === "home",
        );
        const awayTeam = espnEvent.competitions[0].competitors.find(
          (c) => c.homeAway === "away",
        );

        if (!homeTeam || !awayTeam || homeTeam.id === "-1") {
          continue;
        }

        const homeTeamId = externalTeamIdToTeamIdMap.get(homeTeam.id);
        const awayTeamId = externalTeamIdToTeamIdMap.get(awayTeam.id);

        if (!homeTeamId || !awayTeamId) {
          console.warn(
            `Could not map homeTeamId or awayTeamId for ESPN event ${espnEvent.id}. Skipping.`,
          );
          continue;
        }

        const espnSeasonType = seasonTypeMap.get(espnEvent.seasonType.$ref);
        if (!espnSeasonType) {
          console.warn(
            `Could not find a matching season type for ESPN event ${espnEvent.id}. Skipping.`,
          );
          continue;
        }

        const phase = futurePhases.find((p) => {
          const externalPhase = futureExternalPhases.find(
            (ep) => ep.phaseId === p.id,
          );
          if (!externalPhase) return false;
          const metadata = EspnExternalPhaseMetadataSchema.safeParse(
            externalPhase.metadata,
          );
          if (!metadata.success) return false;
          return espnSeasonType.type === metadata.data.type;
        });

        if (!phase) {
          console.warn(
            `Could not find a matching phase for ESPN event ${espnEvent.id}. Skipping.`,
          );
          continue;
        }

        const eventData = {
          phaseId: phase.id,
          startTime: new Date(espnEvent.competitions[0].date),
          type: EVENT_TYPES.GAME,
          homeTeamId,
          awayTeamId,
        };

        if (existingExternalEventIds.has(espnEvent.id)) {
          const existingExternalEvent = existingExternalEvents.find(
            (ee) => ee.externalId === espnEvent.id,
          );
          if (existingExternalEvent) {
            eventsToUpdate.push({
              id: existingExternalEvent.eventId,
              ...eventData,
            });
            externalEventsToUpdate.push({
              dataSourceId: dataSource.id,
              externalId: espnEvent.id,
              metadata: {
                oddsRef: espnEvent.competitions[0]?.odds?.$ref,
                awayTeamScoreRef: awayTeam.score?.$ref,
                homeTeamScoreRef: homeTeam.score?.$ref,
                statusRef: espnEvent.competitions[0]?.status?.$ref,
              },
            });
          }
        } else {
          eventsToCreate.push(eventData);
          newEspnEventsForExternalCreation.push(espnEvent);
        }
      }

      console.log(`Found ${eventsToUpdate.length} events to update.`);
      console.log(`Found ${eventsToCreate.length} new events to create.`);

      if (eventsToCreate.length > 0) {
        console.log(`Bulk creating ${eventsToCreate.length} events...`);
        const createdEvents = await this.eventsMutationService.bulkCreate(
          eventsToCreate,
          tx,
        );
        console.log(`Successfully created ${createdEvents.length} events.`);

        const newExternalEvents: DBExternalEventInsert[] = createdEvents.map(
          (event, index) => {
            const espnEvent = newEspnEventsForExternalCreation[index];
            const homeTeamScoreRef = espnEvent.competitions[0].competitors.find(
              (c) => c.homeAway === "home",
            )?.score?.$ref;
            const awayTeamScoreRef = espnEvent.competitions[0].competitors.find(
              (c) => c.homeAway === "away",
            )?.score?.$ref;
            return {
              dataSourceId: dataSource.id,
              eventId: event.id,
              externalId: espnEvent.id,
              metadata: {
                oddsRef: espnEvent.competitions[0]?.odds?.$ref,
                awayTeamScoreRef,
                homeTeamScoreRef,
                statusRef: espnEvent.competitions[0]?.status?.$ref,
              },
            };
          },
        );

        console.log(
          `Bulk creating ${newExternalEvents.length} external events...`,
        );
        await this.eventsMutationService.bulkCreateExternal(
          newExternalEvents,
          tx,
        );
        console.log(
          `Successfully created ${newExternalEvents.length} external events.`,
        );
      }

      if (eventsToUpdate.length > 0) {
        console.log(`Updating ${eventsToUpdate.length} events...`);
        let updatedCount = 0;
        for (const eventToUpdate of eventsToUpdate) {
          await this.eventsMutationService.update(
            eventToUpdate.id,
            eventToUpdate,
            tx,
          );
          updatedCount++;
        }
        console.log(`Successfully updated ${updatedCount} events.`);
      }

      if (externalEventsToUpdate.length > 0) {
        console.log(
          `Updating ${externalEventsToUpdate.length} external events...`,
        );
        let updatedExternalCount = 0;
        for (const externalEventToUpdate of externalEventsToUpdate) {
          await this.eventsMutationService.updateExternal(
            dataSource.id,
            externalEventToUpdate.externalId,
            externalEventToUpdate,
            tx,
          );
          updatedExternalCount++;
        }
        console.log(
          `Successfully updated ${updatedExternalCount} external events.`,
        );
      }

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

      const allEspnEvents = await this._fetchEspnEvents(
        externalPhases,
        phasesToProcess,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
      );

      let createdEventsCount = 0;
      let updatedEventsCount = 0;
      let createdOddsCount = 0;
      let updatedOddsCount = 0;
      let createdExternalOddsCount = 0;
      let updatedExternalOddsCount = 0;

      for (const espnEvent of allEspnEvents) {
        const { event, status } = await this._createOrUpdateEvent(
          espnEvent,
          dataSource.id,
          phasesToProcess,
          externalPhases,
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

        if (espnEvent.competitions[0]?.odds?.$ref) {
          const espnOdds = await this.espnService.getESPNEventOdds(
            espnEvent.competitions[0].odds.$ref,
          );
          const defaultOdd = espnOdds.find(
            (o) => o.provider.id === externalDefaultSportsbook.externalId,
          );

          if (defaultOdd) {
            const existingOdds = await this.oddsQueryService.findByEventId(
              event.id,
              tx,
            );
            const oddsData = {
              eventId: event.id,
              sportsbookId: defaultSportsbook.id,
              spreadHome: defaultOdd.homeTeamOdds.spreadOdds.toString(),
              spreadAway: defaultOdd.awayTeamOdds.spreadOdds.toString(),
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

      const allEspnEvents = await this._fetchEspnEvents(
        externalPhases,
        phasesToProcess,
        seasonsToProcess,
        seasonIdToExternalIdMap,
        sportLeagueIdToExternalMetadataMap,
      );

      let createdEventsCount = 0;
      let updatedEventsCount = 0;
      let createdLiveScores = 0;
      let updatedLiveScores = 0;
      let createdOutcomes = 0;
      let updatedOutcomes = 0;

      for (const espnEvent of allEspnEvents) {
        const { event, status: eventStatus } = await this._createOrUpdateEvent(
          espnEvent,
          dataSource.id,
          phasesToProcess,
          externalPhases,
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
