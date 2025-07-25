import { accountsTable } from "../../db/schema.js";

export type DBAccount = typeof accountsTable.$inferSelect;
export type DBAccountInsert = typeof accountsTable.$inferInsert;
export type DBAccountUpdate = Partial<DBAccountInsert>;
