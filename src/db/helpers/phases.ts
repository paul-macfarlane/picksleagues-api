import { eq, and } from "drizzle-orm";
import { DBOrTx } from "..";
import {
  DBExternalPhase,
  DBExternalPhaseInsert,
  DBExternalPhaseUpdate,
  DBPhase,
  DBPhaseInsert,
  DBPhaseUpdate,
  externalPhasesTable,
  phasesTable,
} from "../schema";

export async function insertPhase(
  dbOrTx: DBOrTx,
  phase: DBPhaseInsert,
): Promise<DBPhase> {
  const insertedPhase = await dbOrTx
    .insert(phasesTable)
    .values(phase)
    .returning();
  return insertedPhase[0];
}

export async function updatePhase(
  dbOrTx: DBOrTx,
  phaseId: string,
  phase: DBPhaseUpdate,
): Promise<DBPhase> {
  const updatedPhase = await dbOrTx
    .update(phasesTable)
    .set(phase)
    .where(eq(phasesTable.id, phaseId))
    .returning();
  return updatedPhase[0];
}

export async function getExternalPhaseBySourceAndId(
  dbOrTx: DBOrTx,
  dataSourceId: string,
  externalId: string,
): Promise<DBExternalPhase | undefined> {
  const externalPhase = await dbOrTx
    .select()
    .from(externalPhasesTable)
    .where(
      and(
        eq(externalPhasesTable.dataSourceId, dataSourceId),
        eq(externalPhasesTable.externalId, externalId),
      ),
    );

  return externalPhase[0];
}

export async function insertExternalPhase(
  dbOrTx: DBOrTx,
  externalPhase: DBExternalPhaseInsert,
): Promise<DBExternalPhase> {
  const insertedExternalPhase = await dbOrTx
    .insert(externalPhasesTable)
    .values(externalPhase)
    .returning();
  return insertedExternalPhase[0];
}

export async function updateExternalPhase(
  dbOrTx: DBOrTx,
  dataSourceId: string,
  externalId: string,
  externalPhase: DBExternalPhaseUpdate,
): Promise<DBExternalPhase> {
  const updatedExternalPhase = await dbOrTx
    .update(externalPhasesTable)
    .set(externalPhase)
    .where(
      and(
        eq(externalPhasesTable.dataSourceId, dataSourceId),
        eq(externalPhasesTable.externalId, externalId),
      ),
    )
    .returning();
  return updatedExternalPhase[0];
}
