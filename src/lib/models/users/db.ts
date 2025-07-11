import { usersTable } from "../../../db/schema";

export type DBUser = typeof usersTable.$inferSelect;

export type DBUserInsert = typeof usersTable.$inferInsert;

export type DBUserUpdate = Partial<DBUserInsert>;
