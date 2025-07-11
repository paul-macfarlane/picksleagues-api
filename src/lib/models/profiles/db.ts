import { profilesTable } from "../../../db/schema";

export type DBProfile = typeof profilesTable.$inferSelect;

export type DBProfileInsert = typeof profilesTable.$inferInsert;

export type DBProfileUpdate = Partial<DBProfileInsert>;
