import { eq } from "drizzle-orm";
import { DBOrTx } from "..";
import { leagueTypesTable } from "../schema";
import { LEAGUE_TYPE_SLUGS } from "../../lib/models/leagueTypes/constants";
import { DBLeagueType } from "../../lib/models/leagueTypes/db";
import { DBLeagueTypeInsert } from "../../lib/models/leagueTypes/db";

export async function insertLeagueType(
  dbOrTx: DBOrTx,
  leagueType: DBLeagueTypeInsert,
): Promise<DBLeagueType> {
  const leagueTypes = await dbOrTx
    .insert(leagueTypesTable)
    .values(leagueType)
    .returning();
  return leagueTypes[0];
}

export async function getLeagueTypeById(
  dbOrTx: DBOrTx,
  id: string,
): Promise<DBLeagueType | undefined> {
  const leagueTypes = await dbOrTx
    .select()
    .from(leagueTypesTable)
    .where(eq(leagueTypesTable.id, id))
    .limit(1);
  return leagueTypes[0] ?? undefined;
}

export async function getLeagueTypeBySlug(
  dbOrTx: DBOrTx,
  slug: LEAGUE_TYPE_SLUGS,
): Promise<DBLeagueType | undefined> {
  const leagueTypes = await dbOrTx
    .select()
    .from(leagueTypesTable)
    .where(eq(leagueTypesTable.slug, slug))
    .limit(1);
  return leagueTypes[0] ?? undefined;
}
