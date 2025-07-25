import { externalSeasonsTable, seasonsTable } from "../../db/schema.js";
import { z } from "zod";

export type DBSeason = typeof seasonsTable.$inferSelect;
export type DBSeasonInsert = typeof seasonsTable.$inferInsert;
export type DBSeasonUpdate = Partial<DBSeasonInsert>;

export type DBExternalSeason = typeof externalSeasonsTable.$inferSelect;
export type DBExternalSeasonInsert = typeof externalSeasonsTable.$inferInsert;
export type DBExternalSeasonUpdate = Partial<DBExternalSeasonInsert>;

export const EspnExternalSeasonMetadataSchema = z.object({
  slug: z.string(),
});
