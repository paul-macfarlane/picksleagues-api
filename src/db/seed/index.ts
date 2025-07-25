import "reflect-metadata";
import { db } from "..";
import { seedDataSources } from "./dataSources";
import { seedLeagueTypes } from "./leagueTypes";
import { seedPhaseTemplates } from "./phaseTemplates";
import { seedSportsbooks } from "./sportsbooks";
import { container } from "../../lib/inversify.config";
import { DataSourcesService } from "../../features/dataSources/dataSources.service";
import { TYPES } from "../../lib/inversify.types";
import { PhaseTemplatesService } from "../../features/phaseTemplates/phaseTemplates.service";
import { LeagueTypesService } from "../../features/leagueTypes/leagueTypes.service";
import { SportLeaguesQueryService } from "../../features/sportLeagues/sportLeagues.query.service";
import { SportsbooksMutationService } from "../../features/sportsbooks/sportsbooks.mutation.service";
import { DataSourcesQueryService } from "../../features/dataSources/dataSources.query.service";
import { SportsbooksQueryService } from "../../features/sportsbooks/sportsbooks.query.service";

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
