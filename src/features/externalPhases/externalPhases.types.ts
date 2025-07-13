import { externalPhasesTable } from "../../db/schema";

// Constants

// DB Types
export type DBExternalPhase = typeof externalPhasesTable.$inferSelect;

export type DBExternalPhaseInsert = typeof externalPhasesTable.$inferInsert;

export type DBExternalPhaseUpdate = Partial<DBExternalPhaseInsert>;

// Validation Schemas
