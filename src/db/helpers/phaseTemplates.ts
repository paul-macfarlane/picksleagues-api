import { and, eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { phaseTemplatesTable } from "../schema";
import {
  DBPhaseTemplate,
  DBPhaseTemplateInsert,
} from "../../lib/models/phaseTemplates/db";

export async function insertPhaseTemplate(
  dbOrTx: DBOrTx,
  phaseTemplate: DBPhaseTemplateInsert,
): Promise<DBPhaseTemplate> {
  const phaseTemplates = await dbOrTx
    .insert(phaseTemplatesTable)
    .values(phaseTemplate)
    .returning();
  return phaseTemplates[0];
}

export async function getPhaseTemplatesBySportLeagueId(
  dbOrTx: DBOrTx,
  sportLeagueId: string,
): Promise<DBPhaseTemplate[]> {
  const phaseTemplates = await dbOrTx
    .select()
    .from(phaseTemplatesTable)
    .where(eq(phaseTemplatesTable.sportLeagueId, sportLeagueId));
  return phaseTemplates;
}

export async function getPhaseTemplateBySportLeagueAndLabel(
  dbOrTx: DBOrTx,
  sportLeagueId: string,
  label: string,
): Promise<DBPhaseTemplate | undefined> {
  const phaseTemplate = await dbOrTx
    .select()
    .from(phaseTemplatesTable)
    .where(
      and(
        eq(phaseTemplatesTable.sportLeagueId, sportLeagueId),
        eq(phaseTemplatesTable.label, label),
      ),
    )
    .limit(1);
  return phaseTemplate[0];
}

export async function getPhaseTemplateById(
  dbOrTx: DBOrTx,
  id: string,
): Promise<DBPhaseTemplate | undefined> {
  const phaseTemplate = await dbOrTx
    .select()
    .from(phaseTemplatesTable)
    .where(eq(phaseTemplatesTable.id, id));
  return phaseTemplate[0];
}
