import "reflect-metadata";
import { db } from "../index.js";
import { seedDataSources } from "./dataSources.js";
import { seedLeagueTypes } from "./leagueTypes.js";
import { seedPhaseTemplates } from "./phaseTemplates.js";
import { seedSportsbooks } from "./sportsbooks.js";
import { seedNflPhases } from "./nflPhases.js";
import { container } from "../../lib/inversify.config.js";
import { DataSourcesService } from "../../features/dataSources/dataSources.service.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PhaseTemplatesService } from "../../features/phaseTemplates/phaseTemplates.service.js";
import { LeagueTypesService } from "../../features/leagueTypes/leagueTypes.service.js";
import { SportLeaguesQueryService } from "../../features/sportLeagues/sportLeagues.query.service.js";
import { SportsbooksMutationService } from "../../features/sportsbooks/sportsbooks.mutation.service.js";
import { DataSourcesQueryService } from "../../features/dataSources/dataSources.query.service.js";
import { SportsbooksQueryService } from "../../features/sportsbooks/sportsbooks.query.service.js";
import { PhasesMutationService } from "../../features/phases/phases.mutation.service.js";
import { PhasesQueryService } from "../../features/phases/phases.query.service.js";
import { SeasonsUtilService } from "../../features/seasons/seasons.util.service.js";

async function seed() {
  try {
    await db.transaction(async (tx) => {
      const dataSourcesService = container.get<DataSourcesService>(
        TYPES.DataSourcesService,
      );
      const phaseTemplatesService = container.get<PhaseTemplatesService>(
        TYPES.PhaseTemplatesService,
      );
      const sportLeaguesQueryService = container.get<SportLeaguesQueryService>(
        TYPES.SportLeaguesQueryService,
      );
      const leagueTypesService = container.get<LeagueTypesService>(
        TYPES.LeagueTypesService,
      );
      const sportsbooksMutationService =
        container.get<SportsbooksMutationService>(
          TYPES.SportsbooksMutationService,
        );
      const sportsbooksQueryService = container.get<SportsbooksQueryService>(
        TYPES.SportsbooksQueryService,
      );
      const dataSourcesQueryService = container.get<DataSourcesQueryService>(
        TYPES.DataSourcesQueryService,
      );
      const phasesMutationService = container.get<PhasesMutationService>(
        TYPES.PhasesMutationService,
      );
      const phasesQueryService = container.get<PhasesQueryService>(
        TYPES.PhasesQueryService,
      );
      const seasonsUtilService = container.get<SeasonsUtilService>(
        TYPES.SeasonsUtilService,
      );

      await seedDataSources(dataSourcesService, tx);
      await seedPhaseTemplates(
        phaseTemplatesService,
        sportLeaguesQueryService,
        tx,
      );
      await seedLeagueTypes(leagueTypesService, sportLeaguesQueryService, tx);
      await seedSportsbooks(
        dataSourcesQueryService,
        sportsbooksMutationService,
        sportsbooksQueryService,
        tx,
      );
      await seedNflPhases(
        phasesMutationService,
        phasesQueryService,
        seasonsUtilService,
        sportLeaguesQueryService,
        tx,
      );
    });

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
