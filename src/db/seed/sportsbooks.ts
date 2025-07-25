import { db, DBOrTx } from "..";
import { DATA_SOURCE_NAMES } from "../../features/dataSources/dataSources.types";
import { DataSourcesQueryService } from "../../features/dataSources/dataSources.query.service";
import { SportsbooksMutationService } from "../../features/sportsbooks/sportsbooks.mutation.service";

export async function seedSportsbooks(
  dataSourcesQueryService: DataSourcesQueryService,
  sportsbooksMutationService: SportsbooksMutationService,
  dbOrTx: DBOrTx = db,
) {
  console.log("Seeding sportsbooks...");

  const espnDataSource = await dataSourcesQueryService.findByName(
    DATA_SOURCE_NAMES.ESPN,
    dbOrTx,
  );

  if (!espnDataSource) {
    throw new Error("ESPN data source not found");
  }

  // it's ok to hardcode this for now because we only have one sportsbook that espn consistently provides odds for
  const espnBet = await sportsbooksMutationService.create(
    {
      name: "ESPN BET",
      isDefault: true,
    },
    dbOrTx,
  );

  await sportsbooksMutationService.createExternal(
    {
      dataSourceId: espnDataSource.id,
      externalId: "58",
      sportsbookId: espnBet.id,
    },
    dbOrTx,
  );

  console.log("Sportsbooks seeded successfully.");
}
