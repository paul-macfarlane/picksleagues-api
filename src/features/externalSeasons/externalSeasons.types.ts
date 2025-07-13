import { externalSeasonsTable } from "../../db/schema";

// Constants

// DB Types

export type DBExternalSeason = typeof externalSeasonsTable.$inferSelect;

export type DBExternalSeasonInsert = typeof externalSeasonsTable.$inferInsert;

export type DBExternalSeasonUpdate = Partial<DBExternalSeasonInsert>;

// Validation Schemas
