import "reflect-metadata";
import { seedDataSources } from "./dataSources";
import { seedLeagueTypes } from "./leagueTypes";
import { seedPhaseTemplates } from "./phaseTemplates";
import { container } from "../../lib/inversify.config";
import { DataSourcesService } from "../../features/dataSources/dataSources.service";
import { TYPES } from "../../lib/inversify.types";
import { PhaseTemplatesService } from "../../features/phaseTemplates/phaseTemplates.service";
import { SportLeaguesService } from "../../features/sportLeagues/sportLeagues.service";
import { LeagueTypesService } from "../../features/leagueTypes/leagueTypes.service";
import { db } from "..";

export async function seed() {
  await db.transaction(async (tx) => {
    const dataSourcesService = container.get<DataSourcesService>(
      TYPES.DataSourcesService,
    );
    const phaseTemplatesService = container.get<PhaseTemplatesService>(
      TYPES.PhaseTemplatesService,
    );
    const sportLeaguesService = container.get<SportLeaguesService>(
      TYPES.SportLeaguesService,
    );
    const leagueTypesService = container.get<LeagueTypesService>(
      TYPES.LeagueTypesService,
    );

    await seedDataSources(dataSourcesService, tx);
    await seedPhaseTemplates(phaseTemplatesService, sportLeaguesService, tx);
    await seedLeagueTypes(leagueTypesService, sportLeaguesService, tx);
  });
}

void seed();
