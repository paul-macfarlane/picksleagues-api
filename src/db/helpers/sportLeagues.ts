import { DBOrTx } from "..";
import { eq } from "drizzle-orm";
import { sportsLeaguesTable } from "../schema";
import {
  DBSportLeague,
  DBSportLeagueInsert,
  DBSportLeagueUpdate,
} from "../../lib/models/sportLeagues/db";

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

export async function getSportLeagueByName(
  dbOrTx: DBOrTx,
  name: string,
): Promise<DBSportLeague | undefined> {
  const sportLeague = await dbOrTx
    .select()
    .from(sportsLeaguesTable)
    .where(eq(sportsLeaguesTable.name, name))
    .limit(1);
  return sportLeague[0];
}
