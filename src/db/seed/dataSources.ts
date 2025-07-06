import { db } from "..";
import { getDataSourceByName, insertDataSource } from "../helpers/dataSources";
import { DBDataSource } from "../schema";

export async function seedDataSources(): Promise<DBDataSource[]> {
  const existingDataSource = await getDataSourceByName(db, "ESPN");
  if (existingDataSource) {
    console.log(
      `DataSource already exists as ${JSON.stringify(existingDataSource)}`,
    );
    return [existingDataSource];
  }

  console.log("Creating ESPN data source");
  const espnDataSource = await insertDataSource("ESPN");
  console.log(`Created ESPN data source as ${JSON.stringify(espnDataSource)}`);

  return [espnDataSource];
}
