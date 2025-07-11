import { and, eq } from "drizzle-orm";
import { externalPhasesTable } from "../schema";
import { DBOrTx } from "..";
import {
  DBExternalPhase,
  DBExternalPhaseInsert,
  DBExternalPhaseUpdate,
} from "../../lib/models/externalPhases/db";

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
