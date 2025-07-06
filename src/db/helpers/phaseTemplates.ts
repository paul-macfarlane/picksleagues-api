import { and, eq } from "drizzle-orm";
import { DBOrTx } from "..";
import {
  DBPhaseTemplate,
  DBPhaseTemplateInsert,
  phaseTemplatesTable,
} from "../schema";

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
