import { dataSourcesTable } from "../../../db/schema";

export type DBDataSource = typeof dataSourcesTable.$inferSelect;

export type DBDataSourceInsert = typeof dataSourcesTable.$inferInsert;

export type DBDataSourceUpdate = Partial<DBDataSourceInsert>;
