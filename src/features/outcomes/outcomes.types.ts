import { outcomesTable } from "../../db/schema";

export type DBOutcome = typeof outcomesTable.$inferSelect;
export type DBOutcomeInsert = typeof outcomesTable.$inferInsert;
export type DBOutcomeUpdate = Partial<DBOutcomeInsert>;
