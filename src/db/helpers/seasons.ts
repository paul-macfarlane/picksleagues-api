import { eq, and } from "drizzle-orm";
import { DBOrTx } from "..";
import {
  DBExternalSeason,
  DBExternalSeasonInsert,
  DBExternalSeasonUpdate,
  DBSeason,
  DBSeasonInsert,
  DBSeasonUpdate,
  externalSeasonsTable,
  seasonsTable,
} from "../schema";

export async function insertSeason(
  dbOrTx: DBOrTx,
  data: DBSeasonInsert,
): Promise<DBSeason> {
  const season = await dbOrTx.insert(seasonsTable).values(data).returning();
  return season[0];
}

export async function updateSeason(
  dbOrTx: DBOrTx,
  seasonId: string,
  data: DBSeasonUpdate,
): Promise<DBSeason> {
  const season = await dbOrTx
    .update(seasonsTable)
    .set(data)
    .where(eq(seasonsTable.id, seasonId))
    .returning();
  return season[0];
}

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
