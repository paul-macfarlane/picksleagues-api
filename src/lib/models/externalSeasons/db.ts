import { externalSeasonsTable } from "../../../db/schema";

export type DBExternalSeason = typeof externalSeasonsTable.$inferSelect;

export type DBExternalSeasonInsert = typeof externalSeasonsTable.$inferInsert;

export type DBExternalSeasonUpdate = Partial<DBExternalSeasonInsert>;
