import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { EventsMutationService } from "./events.mutation.service";
import { EventsQueryService } from "./events.query.service";
import { db } from "../../db";
import { DATA_SOURCE_NAMES } from "../dataSources/dataSources.types";
import { DataSourcesQueryService } from "../dataSources/dataSources.query.service";
import { NotFoundError } from "../../lib/errors";
import { EspnService } from "../../integrations/espn/espn.service";
import { SeasonsQueryService } from "../seasons/seasons.query.service";
import { PhasesQueryService } from "../phases/phases.query.service";
import { TeamsQueryService } from "../teams/teams.query.service";
import { SportLeaguesQueryService } from "../sportLeagues/sportLeagues.query.service";
import { EVENT_TYPES } from "./events.types";
import { EspnExternalSportLeagueMetadataSchema } from "../sportLeagues/sportLeagues.types";
import { EspnExternalPhaseMetadataSchema } from "../phases/phase.types";

@injectable()
export class EventsService {
  constructor(
    @inject(TYPES.EventsMutationService)
    private eventsMutationService: EventsMutationService,
    @inject(TYPES.EventsQueryService)
    private eventsQueryService: EventsQueryService,
    @inject(TYPES.DataSourcesQueryService)
    private dataSourcesQueryService: DataSourcesQueryService,
    @inject(TYPES.EspnService)
    private espnService: EspnService,
    @inject(TYPES.SeasonsQueryService)
    private seasonsQueryService: SeasonsQueryService,
    @inject(TYPES.PhasesQueryService)
    private phasesQueryService: PhasesQueryService,
    @inject(TYPES.TeamsQueryService)
    private teamsQueryService: TeamsQueryService,
    @inject(TYPES.SportLeaguesQueryService)
    private sportLeaguesQueryService: SportLeaguesQueryService,
  ) {}

  async syncEvents(): Promise<void> {
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

        const latestSeason =
          await this.seasonsQueryService.findLatestBySportLeagueId(
            sportLeague.id,
            tx,
          );
        if (!latestSeason) {
          console.error(`Latest season not found for ${sportLeague.id}`);
          continue;
        }

        const latestSeasonExternal =
          await this.seasonsQueryService.findExternalBySourceAndSeasonId(
            dataSource.id,
            latestSeason.id,
            tx,
          );
        if (!latestSeasonExternal) {
          console.error(
            `Latest season external not found for ${latestSeason.id}`,
          );
          continue;
        }

        const phases = await this.phasesQueryService.listBySeasonId(
          latestSeason.id,
          tx,
        );
        const futurePhases = phases.filter(
          (phase) => phase.startDate && new Date(phase.startDate) > new Date(),
        );

        const futureExternalPhases =
          await this.phasesQueryService.listExternalByPhaseIds(
            futurePhases.map((phase) => phase.id),
            tx,
          );
        if (!futureExternalPhases.length) {
          continue;
        }

        const teams = await this.teamsQueryService.listBySportLeagueId(
          externalSportLeague.sportLeagueId,
          tx,
        );

        const externalTeams =
          await this.teamsQueryService.listExternalByDataSourceIdAndTeamIds(
            dataSource.id,
            teams.map((team) => team.id),
            tx,
          );

        const externalTeamIdToTeamIdMap = new Map(
          externalTeams.map((externalTeam) => [
            externalTeam.externalId,
            externalTeam.teamId,
          ]),
        );

        for (const futureExternalPhase of futureExternalPhases) {
          const parsedExternalPhaseMetadata =
            EspnExternalPhaseMetadataSchema.safeParse(
              futureExternalPhase.metadata,
            );
          if (!parsedExternalPhaseMetadata.success) {
            console.error(
              `Invalid metadata for ${futureExternalPhase.externalId}`,
            );
            continue;
          }

          const espnEvents = await this.espnService.getESPNEvents(
            parsedExternalSportLeagueMetadata.data.sportSlug,
            parsedExternalSportLeagueMetadata.data.leagueSlug,
            latestSeasonExternal.externalId,
            parsedExternalPhaseMetadata.data.type,
            parsedExternalPhaseMetadata.data.number,
          );
          const futureESPNEvents = espnEvents.filter(
            (event) =>
              event.competitions[0].date &&
              new Date(event.competitions[0].date) > new Date(),
          );

          for (const futureESPNEvent of futureESPNEvents) {
            const externalMetadata = {};

            const existingExternalEvent =
              await this.eventsQueryService.findExternalByDataSourceIdAndExternalId(
                dataSource.id,
                futureESPNEvent.id,
                tx,
              );

            const homeTeam = futureESPNEvent.competitions[0].competitors.find(
              (competitor) => competitor.homeAway === "home",
            );
            if (!homeTeam) {
              console.error(`Home team not found for ${futureESPNEvent.id}`);
              continue;
            }

            if (homeTeam.id === "-1") {
              console.log(
                `Matchup not set yet for ${futureESPNEvent.id}, skipping`,
              );
              continue;
            }

            const awayTeam = futureESPNEvent.competitions[0].competitors.find(
              (competitor) => competitor.homeAway === "away",
            );
            if (!awayTeam) {
              console.error(
                `Away team not found for future event ${futureESPNEvent.id}`,
              );
              continue;
            }

            const homeTeamId = externalTeamIdToTeamIdMap.get(homeTeam.id);
            if (!homeTeamId) {
              console.error(
                `Home team not found for future event ${futureESPNEvent.id} with external id ${homeTeam.id}`,
              );
              continue;
            }

            const awayTeamId = externalTeamIdToTeamIdMap.get(awayTeam.id);
            if (!awayTeamId) {
              console.error(
                `Away team not found for future event ${futureESPNEvent.id} with external id ${awayTeam.id}`,
              );
              continue;
            }

            if (existingExternalEvent) {
              const updatedExternalEvent =
                await this.eventsMutationService.updateExternal(
                  dataSource.id,
                  futureESPNEvent.id,
                  {
                    metadata: externalMetadata,
                  },
                  tx,
                );

              console.log(
                `Updated external event ${JSON.stringify(updatedExternalEvent)}`,
              );

              const updatedEvent = await this.eventsMutationService.update(
                existingExternalEvent.eventId,
                {
                  startTime: new Date(futureESPNEvent.competitions[0].date),
                  type: EVENT_TYPES.GAME,
                  homeTeamId,
                  awayTeamId,
                },
                tx,
              );

              console.log(`Updated event ${JSON.stringify(updatedEvent)}`);
            } else {
              const createdEvent = await this.eventsMutationService.create(
                {
                  phaseId: futureExternalPhase.phaseId,
                  startTime: new Date(futureESPNEvent.competitions[0].date),
                  type: EVENT_TYPES.GAME,
                  homeTeamId,
                  awayTeamId,
                },
                tx,
              );

              console.log(`Created event ${JSON.stringify(createdEvent)}`);

              const createdExternalEvent =
                await this.eventsMutationService.createExternal(
                  {
                    dataSourceId: dataSource.id,
                    eventId: createdEvent.id,
                    externalId: futureESPNEvent.id,
                    metadata: externalMetadata,
                  },
                  tx,
                );

              console.log(
                `Created external event ${JSON.stringify(createdExternalEvent)}`,
              );
            }
          }
        }
      }
    });
  }
}
