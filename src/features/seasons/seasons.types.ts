import { externalSeasonsTable, seasonsTable } from "../../db/schema";

export type DBSeason = typeof seasonsTable.$inferSelect;
export type DBSeasonInsert = typeof seasonsTable.$inferInsert;
export type DBSeasonUpdate = Partial<DBSeasonInsert>;

export type DBExternalSeason = typeof externalSeasonsTable.$inferSelect;
export type DBExternalSeasonInsert = typeof externalSeasonsTable.$inferInsert;
export type DBExternalSeasonUpdate = Partial<DBExternalSeasonInsert>;
