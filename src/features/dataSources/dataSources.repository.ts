import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { dataSourcesTable } from "../../db/schema";
import {
  DATA_SOURCE_NAMES,
  DBDataSource,
  DBDataSourceInsert,
} from "./dataSources.types";

@injectable()
export class DataSourcesRepository {
  async findByName(
    name: DATA_SOURCE_NAMES,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource | null> {
    const [dataSource] = await dbOrTx
      .select()
      .from(dataSourcesTable)
      .where(eq(dataSourcesTable.name, name))
      .limit(1);
    return dataSource ?? null;
  }

  async create(
    dataSource: DBDataSourceInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBDataSource> {
    const [newDataSource] = await dbOrTx
      .insert(dataSourcesTable)
      .values(dataSource)
      .returning();
    return newDataSource;
  }
}
