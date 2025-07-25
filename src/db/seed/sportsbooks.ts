import { db, DBOrTx } from "../index.js";
import { DATA_SOURCE_NAMES } from "../../features/dataSources/dataSources.types.js";
import { DataSourcesQueryService } from "../../features/dataSources/dataSources.query.service.js";
import { SportsbooksMutationService } from "../../features/sportsbooks/sportsbooks.mutation.service.js";
import { SportsbooksQueryService } from "../../features/sportsbooks/sportsbooks.query.service.js";

export async function seedSportsbooks(
  dataSourcesQueryService: DataSourcesQueryService,
  sportsbooksMutationService: SportsbooksMutationService,
  sportsbooksQueryService: SportsbooksQueryService,
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

  // avoid re-seeding if already exists
  const existingSportsbook = await sportsbooksQueryService.findDefault(dbOrTx);
  if (existingSportsbook) {
    console.log("Sportsbooks already seeded. Skipping...");
    return;
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
