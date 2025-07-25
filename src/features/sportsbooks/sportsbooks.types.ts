import { sportsbooksTable, externalSportsbooksTable } from "../../db/schema";

export type DBSportsbook = typeof sportsbooksTable.$inferSelect;
export type DBSportsbookInsert = typeof sportsbooksTable.$inferInsert;
export type DBSportsbookUpdate = Partial<DBSportsbookInsert>;

export type DBExternalSportsbook = typeof externalSportsbooksTable.$inferSelect;
export type DBExternalSportsbookInsert =
  typeof externalSportsbooksTable.$inferInsert;
export type DBExternalSportsbookUpdate = Partial<DBExternalSportsbookInsert>;
