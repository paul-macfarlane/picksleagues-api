import { and, eq } from "drizzle-orm";
import { externalSeasonsTable } from "../schema";
import { DBOrTx } from "..";
import {
  DBExternalSeason,
  DBExternalSeasonInsert,
  DBExternalSeasonUpdate,
} from "../../lib/models/externalSeasons/db";

export async function getExternalSeasonBySourceAndId(
  dbOrTx: DBOrTx,
  dataSourceId: string,
  externalId: string,
): Promise<DBExternalSeason | undefined> {
  const externalSeason = await dbOrTx
    .select()
    .from(externalSeasonsTable)
    .where(
      and(
        eq(externalSeasonsTable.dataSourceId, dataSourceId),
        eq(externalSeasonsTable.externalId, externalId),
      ),
    );

  return externalSeason[0];
}

export async function insertExternalSeason(
  dbOrTx: DBOrTx,
  data: DBExternalSeasonInsert,
): Promise<DBExternalSeason> {
  const externalSeason = await dbOrTx
    .insert(externalSeasonsTable)
    .values(data)
    .returning();
  return externalSeason[0];
}

export async function updateExternalSeason(
  dbOrTx: DBOrTx,
  dataSourceId: string,
  externalId: string,
  data: DBExternalSeasonUpdate,
): Promise<DBExternalSeason> {
  const externalSeason = await dbOrTx
    .update(externalSeasonsTable)
    .set(data)
    .where(
      and(
        eq(externalSeasonsTable.dataSourceId, dataSourceId),
        eq(externalSeasonsTable.externalId, externalId),
      ),
    )
    .returning();
  return externalSeason[0];
}
