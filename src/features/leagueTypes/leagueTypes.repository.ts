import { eq, inArray } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { leagueTypesTable } from "../../db/schema.js";
import {
  LEAGUE_TYPE_SLUGS,
  DBLeagueType,
  DBLeagueTypeInsert,
} from "./leagueTypes.types.js";

@injectable()
export class LeagueTypesRepository {
  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType | null> {
    const [leagueType] = await dbOrTx
      .select()
      .from(leagueTypesTable)
      .where(eq(leagueTypesTable.id, id))
      .limit(1);
    return leagueType ?? null;
  }

  async findBySlug(
    slug: LEAGUE_TYPE_SLUGS,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType | null> {
    const [leagueType] = await dbOrTx
      .select()
      .from(leagueTypesTable)
      .where(eq(leagueTypesTable.slug, slug))
      .limit(1);
    return leagueType ?? null;
  }

  async create(
    leagueType: DBLeagueTypeInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBLeagueType> {
    const [insertedLeagueType] = await dbOrTx
      .insert(leagueTypesTable)
      .values(leagueType)
      .returning();
    return insertedLeagueType;
  }

  async listByIds(ids: string[], dbOrTx: DBOrTx = db): Promise<DBLeagueType[]> {
    if (ids.length === 0) {
      return [];
    }
    const leagueTypes = await dbOrTx
      .select()
      .from(leagueTypesTable)
      .where(inArray(leagueTypesTable.id, ids));
    return leagueTypes;
  }
}
