import { phaseTemplatesTable } from "../../../db/schema";

export type DBPhaseTemplate = typeof phaseTemplatesTable.$inferSelect;

export type DBPhaseTemplateInsert = typeof phaseTemplatesTable.$inferInsert;

export type DBPhaseTemplateUpdate = Partial<DBPhaseTemplateInsert>;
