import { phasesTable } from "../../db/schema";

// Constants

// DB Types
export type DBPhase = typeof phasesTable.$inferSelect;

export type DBPhaseInsert = typeof phasesTable.$inferInsert;

export type DBPhaseUpdate = Partial<DBPhaseInsert>;

// Validation Schemas
