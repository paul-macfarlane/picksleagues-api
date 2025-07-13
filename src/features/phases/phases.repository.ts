import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { externalPhasesTable, phasesTable } from "../../db/schema";
import {
  DBExternalPhase,
  DBExternalPhaseInsert,
  DBExternalPhaseUpdate,
  DBPhase,
  DBPhaseInsert,
  DBPhaseUpdate,
} from "./phases.types";

@injectable()
export class PhasesRepository {
  async create(phase: DBPhaseInsert, dbOrTx: DBOrTx = db): Promise<DBPhase> {
    const [insertedPhase] = await dbOrTx
      .insert(phasesTable)
      .values(phase)
      .returning();
    return insertedPhase;
  }

  async update(
    phaseId: string,
    phase: DBPhaseUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase> {
    const [updatedPhase] = await dbOrTx
      .update(phasesTable)
      .set(phase)
      .where(eq(phasesTable.id, phaseId))
      .returning();
    return updatedPhase;
  }

  async findExternalBySourceAndId(
    dataSourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase | null> {
    const [externalPhase] = await dbOrTx
      .select()
      .from(externalPhasesTable)
      .where(
        and(
          eq(externalPhasesTable.dataSourceId, dataSourceId),
          eq(externalPhasesTable.externalId, externalId),
        ),
      );

    return externalPhase ?? null;
  }

  async createExternal(
    externalPhase: DBExternalPhaseInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase> {
    const [insertedExternalPhase] = await dbOrTx
      .insert(externalPhasesTable)
      .values(externalPhase)
      .returning();
    return insertedExternalPhase;
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    externalPhase: DBExternalPhaseUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase> {
    const [updatedExternalPhase] = await dbOrTx
      .update(externalPhasesTable)
      .set(externalPhase)
      .where(
        and(
          eq(externalPhasesTable.dataSourceId, dataSourceId),
          eq(externalPhasesTable.externalId, externalId),
        ),
      )
      .returning();
    return updatedExternalPhase;
  }
}
