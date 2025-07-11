import { eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { DATA_SOURCE_NAMES } from "../../lib/models/dataSources/constants";
import {
  DBDataSource,
  DBDataSourceInsert,
} from "../../lib/models/dataSources/db";
import { dataSourcesTable } from "../schema";

export async function getDataSourceByName(
  dbOrTx: DBOrTx,
  name: DATA_SOURCE_NAMES,
): Promise<DBDataSource | undefined> {
  const dataSource = await dbOrTx
    .select()
    .from(dataSourcesTable)
    .where(eq(dataSourcesTable.name, name))
    .limit(1);
  return dataSource[0];
}

export async function insertDataSource(
  dbOrTx: DBOrTx,
  dataSource: DBDataSourceInsert,
): Promise<DBDataSource> {
  const dataSources = await dbOrTx
    .insert(dataSourcesTable)
    .values(dataSource)
    .returning();
  return dataSources[0];
}
