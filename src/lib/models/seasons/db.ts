import { seasonsTable } from "../../../db/schema";

export type DBSeason = typeof seasonsTable.$inferSelect;

export type DBSeasonInsert = typeof seasonsTable.$inferInsert;

export type DBSeasonUpdate = Partial<DBSeasonInsert>;
