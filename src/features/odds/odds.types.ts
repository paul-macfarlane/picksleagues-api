import { oddsTable, externalOddsTable } from "../../db/schema";

export type DBOdds = typeof oddsTable.$inferSelect;
export type DBOddsInsert = typeof oddsTable.$inferInsert;
export type DBOddsUpdate = Partial<DBOddsInsert>;

export type DBExternalOdds = typeof externalOddsTable.$inferSelect;
export type DBExternalOddsInsert = typeof externalOddsTable.$inferInsert;
export type DBExternalOddsUpdate = Partial<DBExternalOddsInsert>;
