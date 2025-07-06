import { DBOrTx } from "..";
import { eq, and } from "drizzle-orm";
import {
  DBExternalSportLeague,
  DBSportLeagueInsert,
  DBSportLeague,
  externalSportLeaguesTable,
  sportsLeaguesTable,
  DBExternalSportLeagueUpdate,
  DBSportLeagueUpdate,
  DBExternalSportLeagueInsert,
} from "../schema";

export async function insertSportLeague(
  dbOrTx: DBOrTx,
  params: DBSportLeagueInsert,
): Promise<DBSportLeague> {
  const sportLeague = await dbOrTx
    .insert(sportsLeaguesTable)
    .values(params)
    .returning();
  return sportLeague[0];
}

export async function updateSportLeague(
  dbOrTx: DBOrTx,
  sportLeagueId: string,
  params: DBSportLeagueUpdate,
): Promise<DBSportLeague> {
  const sportLeague = await dbOrTx
    .update(sportsLeaguesTable)
    .set(params)
    .where(eq(sportsLeaguesTable.id, sportLeagueId))
    .returning();
  return sportLeague[0];
}

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
