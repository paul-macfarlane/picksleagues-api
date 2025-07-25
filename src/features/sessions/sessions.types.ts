import { sessionsTable } from "../../db/schema.js";

export type DBSession = typeof sessionsTable.$inferSelect;
export type DBSessionInsert = typeof sessionsTable.$inferInsert;
export type DBSessionUpdate = Partial<DBSessionInsert>;
