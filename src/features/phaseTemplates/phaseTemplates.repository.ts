import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { phaseTemplatesTable } from "../../db/schema";
import { DBPhaseTemplate, DBPhaseTemplateInsert } from "./phaseTemplates.types";

@injectable()
export class PhaseTemplatesRepository {
  async create(
    data: DBPhaseTemplateInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate> {
    const [phaseTemplate] = await dbOrTx
      .insert(phaseTemplatesTable)
      .values(data)
      .returning();
    return phaseTemplate;
  }

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate[]> {
    const phaseTemplates = await dbOrTx
      .select()
      .from(phaseTemplatesTable)
      .where(eq(phaseTemplatesTable.sportLeagueId, sportLeagueId));
    return phaseTemplates;
  }

  async findBySportLeagueAndLabel(
    sportLeagueId: string,
    label: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate | null> {
    const [phaseTemplate] = await dbOrTx
      .select()
      .from(phaseTemplatesTable)
      .where(
        and(
          eq(phaseTemplatesTable.sportLeagueId, sportLeagueId),
          eq(phaseTemplatesTable.label, label),
        ),
      )
      .limit(1);
    return phaseTemplate ?? null;
  }

  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhaseTemplate | null> {
    const [phaseTemplate] = await dbOrTx
      .select()
      .from(phaseTemplatesTable)
      .where(eq(phaseTemplatesTable.id, id));
    return phaseTemplate ?? null;
  }
}
