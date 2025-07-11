import { DBOrTx } from "..";
import { getDataSourceByName, insertDataSource } from "../helpers/dataSources";
import { DATA_SOURCE_NAMES } from "../../lib/models/dataSources/constants";
import { DBDataSource } from "../../lib/models/dataSources/db";

export async function seedDataSources(dbOrTx: DBOrTx): Promise<DBDataSource[]> {
  const existingDataSource = await getDataSourceByName(
    dbOrTx,
    DATA_SOURCE_NAMES.ESPN,
  );
  if (existingDataSource) {
    console.log(
      `DataSource already exists as ${JSON.stringify(existingDataSource)}`,
    );
    return [existingDataSource];
  }

  console.log("Creating ESPN data source");
  const espnDataSource = await insertDataSource(dbOrTx, {
    name: DATA_SOURCE_NAMES.ESPN,
  });
  console.log(`Created ESPN data source as ${JSON.stringify(espnDataSource)}`);

  return [espnDataSource];
}
