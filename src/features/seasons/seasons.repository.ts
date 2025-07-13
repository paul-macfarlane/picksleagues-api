import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { externalSeasonsTable, seasonsTable } from "../../db/schema";
import {
  DBExternalSeason,
  DBExternalSeasonInsert,
  DBExternalSeasonUpdate,
  DBSeason,
  DBSeasonInsert,
  DBSeasonUpdate,
} from "./seasons.types";

@injectable()
export class SeasonsRepository {
  async create(data: DBSeasonInsert, dbOrTx: DBOrTx = db): Promise<DBSeason> {
    const [season] = await dbOrTx.insert(seasonsTable).values(data).returning();
    return season;
  }

  async update(
    seasonId: string,
    data: DBSeasonUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSeason> {
    const [season] = await dbOrTx
      .update(seasonsTable)
      .set(data)
      .where(eq(seasonsTable.id, seasonId))
      .returning();
    return season;
  }

  async findExternalBySourceAndId(
    dataSourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSeason | null> {
    const [externalSeason] = await dbOrTx
      .select()
      .from(externalSeasonsTable)
      .where(
        and(
          eq(externalSeasonsTable.dataSourceId, dataSourceId),
          eq(externalSeasonsTable.externalId, externalId),
        ),
      );

    return externalSeason ?? null;
  }

  async createExternal(
    data: DBExternalSeasonInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSeason> {
    const [externalSeason] = await dbOrTx
      .insert(externalSeasonsTable)
      .values(data)
      .returning();
    return externalSeason;
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    data: DBExternalSeasonUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSeason> {
    const [externalSeason] = await dbOrTx
      .update(externalSeasonsTable)
      .set(data)
      .where(
        and(
          eq(externalSeasonsTable.dataSourceId, dataSourceId),
          eq(externalSeasonsTable.externalId, externalId),
        ),
      )
      .returning();
    return externalSeason;
  }
}
