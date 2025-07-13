import { dataSourcesTable } from "../../db/schema";

// Constants

export enum DATA_SOURCE_NAMES {
  ESPN = "ESPN",
}

// DB Types

export type DBDataSource = typeof dataSourcesTable.$inferSelect;

export type DBDataSourceInsert = typeof dataSourcesTable.$inferInsert;

export type DBDataSourceUpdate = Partial<DBDataSourceInsert>;

// Validation Schemas
