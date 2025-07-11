import { eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { seasonsTable } from "../schema";
import {
  DBSeason,
  DBSeasonInsert,
  DBSeasonUpdate,
} from "../../lib/models/seasons/db";

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
