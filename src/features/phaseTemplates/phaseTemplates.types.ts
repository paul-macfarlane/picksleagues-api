import { phaseTemplatesTable } from "../../db/schema";
import { z } from "zod";

// Constants

export enum PHASE_TEMPLATE_TYPES {
  WEEK = "week",
}

// DB Types
export type DBPhaseTemplate = typeof phaseTemplatesTable.$inferSelect;

export type DBPhaseTemplateInsert = typeof phaseTemplatesTable.$inferInsert;

export type DBPhaseTemplateUpdate = Partial<DBPhaseTemplateInsert>;

// Validation Schemas
export const GetPhaseTemplatesSchema = z.object({
  typeIdOrSlug: z.string().trim(),
});
