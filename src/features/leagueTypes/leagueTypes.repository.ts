import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { leagueTypesTable } from "../../db/schema";
import {
  LEAGUE_TYPE_SLUGS,
  DBLeagueType,
  DBLeagueTypeInsert,
} from "./leagueTypes.types";

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
}
