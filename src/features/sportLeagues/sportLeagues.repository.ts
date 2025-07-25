import { and, eq, inArray } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { externalSportLeaguesTable, sportsLeaguesTable } from "../../db/schema.js";
import {
  DBExternalSportLeague,
  DBExternalSportLeagueInsert,
  DBExternalSportLeagueUpdate,
  DBSportLeague,
  DBSportLeagueInsert,
  DBSportLeagueUpdate,
} from "./sportLeagues.types.js";

@injectable()
export class SportLeaguesRepository {
  async create(
    params: DBSportLeagueInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague> {
    const [sportLeague] = await dbOrTx
      .insert(sportsLeaguesTable)
      .values(params)
      .returning();
    return sportLeague;
  }

  async update(
    sportLeagueId: string,
    params: DBSportLeagueUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague> {
    const [sportLeague] = await dbOrTx
      .update(sportsLeaguesTable)
      .set(params)
      .where(eq(sportsLeaguesTable.id, sportLeagueId))
      .returning();
    return sportLeague;
  }

  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague | null> {
    const [sportLeague] = await dbOrTx
      .select()
      .from(sportsLeaguesTable)
      .where(eq(sportsLeaguesTable.id, id))
      .limit(1);
    return sportLeague ?? null;
  }

  async findByName(
    name: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague | null> {
    const [sportLeague] = await dbOrTx
      .select()
      .from(sportsLeaguesTable)
      .where(eq(sportsLeaguesTable.name, name))
      .limit(1);
    return sportLeague ?? null;
  }

  async list(dbOrTx: DBOrTx = db): Promise<DBSportLeague[]> {
    return dbOrTx.select().from(sportsLeaguesTable);
  }

  async listExternalBySourceAndSportLeagueIds(
    dataSourceId: string,
    sportLeagueIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSportLeague[]> {
    if (sportLeagueIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(externalSportLeaguesTable)
      .where(
        and(
          eq(externalSportLeaguesTable.dataSourceId, dataSourceId),
          inArray(externalSportLeaguesTable.sportLeagueId, sportLeagueIds),
        ),
      );
  }

  async findExternalBySourceAndExternalId(
    sourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSportLeague | null> {
    const [externalSportLeague] = await dbOrTx
      .select()
      .from(externalSportLeaguesTable)
      .where(
        and(
          eq(externalSportLeaguesTable.dataSourceId, sourceId),
          eq(externalSportLeaguesTable.externalId, externalId),
        ),
      )
      .limit(1);
    return externalSportLeague;
  }

  async findExternalBySourceAndSportLeagueId(
    sourceId: string,
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSportLeague | null> {
    const [externalSportLeague] = await dbOrTx
      .select()
      .from(externalSportLeaguesTable)
      .where(
        and(
          eq(externalSportLeaguesTable.dataSourceId, sourceId),
          eq(externalSportLeaguesTable.sportLeagueId, sportLeagueId),
        ),
      )
      .limit(1);
    return externalSportLeague;
  }

  async createExternal(
    params: DBExternalSportLeagueInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSportLeague> {
    const [externalSportLeague] = await dbOrTx
      .insert(externalSportLeaguesTable)
      .values(params)
      .returning();
    return externalSportLeague;
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    params: DBExternalSportLeagueUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSportLeague> {
    const [externalSportLeague] = await dbOrTx
      .update(externalSportLeaguesTable)
      .set(params)
      .where(
        and(
          eq(externalSportLeaguesTable.dataSourceId, dataSourceId),
          eq(externalSportLeaguesTable.externalId, externalId),
        ),
      )
      .returning();
    return externalSportLeague;
  }
}
