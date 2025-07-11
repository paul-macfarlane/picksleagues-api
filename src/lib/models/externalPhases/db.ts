import { externalPhasesTable } from "../../../db/schema";

export type DBExternalPhase = typeof externalPhasesTable.$inferSelect;

export type DBExternalPhaseInsert = typeof externalPhasesTable.$inferInsert;

export type DBExternalPhaseUpdate = Partial<DBExternalPhaseInsert>;
