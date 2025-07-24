import { injectable, inject } from "inversify";
import { db } from "../../db";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { EVENT_TYPES } from "./events.types";
import { EventsQueryService } from "./events.query.service";
import { EventsMutationService } from "./events.mutation.service";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service";
import { SeasonsQueryService } from "../seasons/seasons.query.service";
import { PhasesQueryService } from "../phases/phases.query.service";
import { TeamsQueryService } from "../teams/teams.query.service";
import { EspnService } from "../../integrations/espn/espn.service";
import { NotFoundError } from "../../lib/errors";
import { TYPES } from "../../lib/inversify.types";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types";
import { EspnExternalPhaseMetadataSchema } from "../phases/phase.types";
import pLimit from "p-limit";
import {
  DBEventInsert,
  DBEventUpdate,
  DBExternalEvent,
  DBExternalEventInsert,
  DBExternalEventUpdate,
} from "./events.types";
import { ESPNEvent, ESPNSeasonType } from "../../integrations/espn/espn.types";
import axios from "axios";

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
  ) {}

  async syncEvents(): Promise<void> {
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

      const latestSeasons =
        await this.seasonsQueryService.findLatestBySportLeagueIds(
          sportLeagues.map((sl) => sl.id),
          tx,
        );
      console.log(`Found ${latestSeasons.length} latest seasons.`);

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
        existingExternalEvents.map((ee: DBExternalEvent) => ee.externalId),
      );
      console.log(
        `Found ${existingExternalEvents.length} existing external events.`,
      );

      const limit = pLimit(10);

      console.log("Fetching ESPN events for future phases...");
      const eventPromises = futureExternalPhases.map((futureExternalPhase) => {
        const phase = futurePhases.find(
          (p) => p.id === futureExternalPhase.phaseId,
        );
        if (!phase) return Promise.resolve([]);

        const season = seasonsToProcess.find((s) => s.id === phase.seasonId);
        if (!season) return Promise.resolve([]);

        const externalSeasonId = seasonIdToExternalIdMap.get(season.id);
        if (!externalSeasonId) return Promise.resolve([]);

        const externalSportLeagueMetadata =
          sportLeagueIdToExternalMetadataMap.get(season.sportLeagueId);
        if (!externalSportLeagueMetadata) return Promise.resolve([]);

        const parsedExternalPhaseMetadata =
          EspnExternalPhaseMetadataSchema.safeParse(
            futureExternalPhase.metadata,
          );
        if (!parsedExternalPhaseMetadata.success) {
          console.warn(
            `Invalid external phase metadata for phaseId: ${futureExternalPhase.phaseId}. Skipping.`,
          );
          return Promise.resolve([]);
        }

        return limit(() =>
          this.espnService.getESPNEvents(
            externalSportLeagueMetadata.sportSlug,
            externalSportLeagueMetadata.leagueSlug,
            externalSeasonId,
            parsedExternalPhaseMetadata.data.type,
            parsedExternalPhaseMetadata.data.number,
          ),
        );
      });

      const espnEventsByPhase = await Promise.all(eventPromises);
      const allEspnEvents: ESPNEvent[] = espnEventsByPhase.flat();
      console.log(
        `Fetched a total of ${allEspnEvents.length} events from ESPN.`,
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
              metadata: {},
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
            return {
              dataSourceId: dataSource.id,
              eventId: event.id,
              externalId: espnEvent.id,
              metadata: {},
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
}
