import { ESPN_SEASON_TYPES } from "../../integrations/espn/espn.types.js";
import { externalPhasesTable, phasesTable } from "../../db/schema.js";
import { z } from "zod";

// Constants

// DB Types
export type DBPhase = typeof phasesTable.$inferSelect;
export type DBPhaseInsert = typeof phasesTable.$inferInsert;
export type DBPhaseUpdate = Partial<DBPhaseInsert>;
export type DBExternalPhase = typeof externalPhasesTable.$inferSelect;
export type DBExternalPhaseInsert = typeof externalPhasesTable.$inferInsert;
export type DBExternalPhaseUpdate = Partial<DBExternalPhaseInsert>;

// Validation Schemas

export const EspnExternalPhaseMetadataSchema = z.object({
  number: z.number(),
  type: z.nativeEnum(ESPN_SEASON_TYPES),
});
