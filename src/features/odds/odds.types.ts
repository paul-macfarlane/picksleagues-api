import { oddsTable, externalOddsTable } from "../../db/schema.js";
import { DBSportsbook } from "../sportsbooks/sportsbooks.types.js";

export enum ODDS_INCLUDES {
  SPORTSBOOK = "sportsbook",
}

// Database Types

export type DBOdds = typeof oddsTable.$inferSelect;
export type DBOddsInsert = typeof oddsTable.$inferInsert;
export type DBOddsUpdate = Partial<DBOddsInsert>;

export type DBExternalOdds = typeof externalOddsTable.$inferSelect;
export type DBExternalOddsInsert = typeof externalOddsTable.$inferInsert;
export type DBExternalOddsUpdate = Partial<DBExternalOddsInsert>;

export type PopulatedDBOdds = DBOdds & {
  sportsbook?: DBSportsbook;
};
