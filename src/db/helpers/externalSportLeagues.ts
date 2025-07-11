import { and, eq } from "drizzle-orm";
import {
  DBExternalSportLeague,
  DBExternalSportLeagueInsert,
  DBExternalSportLeagueUpdate,
} from "../../lib/models/externalSportLeagues/db";
import { DBOrTx } from "..";
import { externalSportLeaguesTable } from "../schema";

export async function getExternalSportLeagueBySourceAndId(
  dbOrTx: DBOrTx,
  sourceId: string,
  externalId: string,
): Promise<DBExternalSportLeague | undefined> {
  const externalSportLeague = await dbOrTx
    .select()
    .from(externalSportLeaguesTable)
    .where(
      and(
        eq(externalSportLeaguesTable.dataSourceId, sourceId),
        eq(externalSportLeaguesTable.externalId, externalId),
      ),
    )
    .limit(1);
  return externalSportLeague[0];
}

export async function getExternalSportLeagueBySourceAndMetadata(
  dbOrTx: DBOrTx,
  sourceId: string,
  metadata: Record<string, string>,
): Promise<DBExternalSportLeague | undefined> {
  const externalSportLeague = await dbOrTx
    .select()
    .from(externalSportLeaguesTable)
    .where(
      and(
        eq(externalSportLeaguesTable.dataSourceId, sourceId),
        eq(externalSportLeaguesTable.metadata, metadata),
      ),
    );
  return externalSportLeague[0];
}

export async function insertExternalSportLeague(
  dbOrTx: DBOrTx,
  params: DBExternalSportLeagueInsert,
): Promise<DBExternalSportLeague> {
  const externalSportLeague = await dbOrTx
    .insert(externalSportLeaguesTable)
    .values(params)
    .returning();
  return externalSportLeague[0];
}

export async function updateExternalSportLeague(
  dbOrTx: DBOrTx,
  dataSourceId: string,
  externalId: string,
  params: DBExternalSportLeagueUpdate,
): Promise<DBExternalSportLeague> {
  const externalSportLeague = await dbOrTx
    .update(externalSportLeaguesTable)
    .set(params)
    .where(
      and(
        eq(externalSportLeaguesTable.dataSourceId, dataSourceId),
        eq(externalSportLeaguesTable.externalId, externalId),
      ),
    )
    .returning();
  return externalSportLeague[0];
}
