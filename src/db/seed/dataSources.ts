import { DATA_SOURCE_NAMES } from "../../features/dataSources/dataSources.types";
import { DataSourcesService } from "../../features/dataSources/dataSources.service";
import { db, DBOrTx } from "..";

export async function seedDataSources(
  dataSourcesService: DataSourcesService,
  dbOrTx: DBOrTx = db,
): Promise<void> {
  console.log("Creating ESPN data source");
  const espnDataSource = await dataSourcesService.findOrCreateByName(
    DATA_SOURCE_NAMES.ESPN,
    dbOrTx,
  );
  console.log(`Created ESPN data source as ${JSON.stringify(espnDataSource)}`);
}
