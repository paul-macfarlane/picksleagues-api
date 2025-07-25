import { externalPhasesTable, phasesTable } from "../../db/schema.js";

export type DBPhase = typeof phasesTable.$inferSelect;
export type DBPhaseInsert = typeof phasesTable.$inferInsert;
export type DBPhaseUpdate = Partial<DBPhaseInsert>;

export type DBExternalPhase = typeof externalPhasesTable.$inferSelect;
export type DBExternalPhaseInsert = typeof externalPhasesTable.$inferInsert;
export type DBExternalPhaseUpdate = Partial<DBExternalPhaseInsert>;
