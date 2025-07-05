import { db } from "..";
import { dataSourcesTable, DBDataSource } from "../schema";

async function createDataSource(name: string): Promise<DBDataSource> {
  const dataSources = await db.insert(dataSourcesTable).values({
    name,
  }).returning();
  return dataSources[0];
}

export async function seedDataSources(): Promise<DBDataSource[]> {
  const espnDataSource = await createDataSource("ESPN");
  
  return [espnDataSource];
}