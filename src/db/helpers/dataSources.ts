import { eq } from "drizzle-orm";
import { dataSourcesTable, DBDataSource } from "../schema";
import { DBOrTx } from "..";

export async function getDataSourceByName(
  dbOrTx: DBOrTx,
  name: string,
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
  name: string,
): Promise<DBDataSource> {
  const dataSources = await dbOrTx
    .insert(dataSourcesTable)
    .values({
      name,
    })
    .returning();
  return dataSources[0];
}
