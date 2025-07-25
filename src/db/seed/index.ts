import "reflect-metadata";
import { db } from "../index.js";
import { seedDataSources } from "./dataSources.js";
import { seedLeagueTypes } from "./leagueTypes.js";
import { seedPhaseTemplates } from "./phaseTemplates.js";
import { seedSportsbooks } from "./sportsbooks.js";
import { container } from "../../lib/inversify.config.js";
import { DataSourcesService } from "../../features/dataSources/dataSources.service.js";
import { TYPES } from "../../lib/inversify.types.js";
import { PhaseTemplatesService } from "../../features/phaseTemplates/phaseTemplates.service.js";
import { LeagueTypesService } from "../../features/leagueTypes/leagueTypes.service.js";
import { SportLeaguesQueryService } from "../../features/sportLeagues/sportLeagues.query.service.js";
import { SportsbooksMutationService } from "../../features/sportsbooks/sportsbooks.mutation.service.js";
import { DataSourcesQueryService } from "../../features/dataSources/dataSources.query.service.js";
import { SportsbooksQueryService } from "../../features/sportsbooks/sportsbooks.query.service.js";

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
    });

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
