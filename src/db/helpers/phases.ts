import { eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { phasesTable } from "../schema";
import {
  DBPhase,
  DBPhaseInsert,
  DBPhaseUpdate,
} from "../../lib/models/phases/db";

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
