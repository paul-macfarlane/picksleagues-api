import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
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

  async findCurrentBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSeason | null> {
    const now = new Date();
    const [season] = await dbOrTx
      .select()
      .from(seasonsTable)
      .where(
        and(
          eq(seasonsTable.sportLeagueId, sportLeagueId),
          lte(seasonsTable.startDate, now),
          gte(seasonsTable.endDate, now),
        ),
      )
      .orderBy(desc(seasonsTable.startDate))
      .limit(1);
    return season ?? null;
  }

  async findCurrentBySportLeagueIds(
    sportLeagueIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBSeason[]> {
    if (sportLeagueIds.length === 0) {
      return [];
    }
    const now = new Date();
    return dbOrTx
      .select()
      .from(seasonsTable)
      .where(
        and(
          inArray(seasonsTable.sportLeagueId, sportLeagueIds),
          lte(seasonsTable.startDate, now),
          gte(seasonsTable.endDate, now),
        ),
      );
  }

  async findLatestBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSeason | null> {
    const [season] = await dbOrTx
      .select()
      .from(seasonsTable)
      .where(eq(seasonsTable.sportLeagueId, sportLeagueId))
      .orderBy(desc(seasonsTable.startDate))
      .limit(1);
    return season ?? null;
  }

  async findLatestBySportLeagueIds(
    sportLeagueIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBSeason[]> {
    if (sportLeagueIds.length === 0) {
      return [];
    }
    const result = await dbOrTx
      .select()
      .from(seasonsTable)
      .where(inArray(seasonsTable.sportLeagueId, sportLeagueIds))
      .orderBy(seasonsTable.sportLeagueId, desc(seasonsTable.startDate));

    const latestSeasonsMap = new Map<string, DBSeason>();
    for (const row of result) {
      if (!latestSeasonsMap.has(row.sportLeagueId)) {
        latestSeasonsMap.set(row.sportLeagueId, row);
      }
    }
    return Array.from(latestSeasonsMap.values());
  }

  async findExternalBySourceAndExternalId(
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

  async findExternalBySourceAndSeasonId(
    dataSourceId: string,
    seasonId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSeason | null> {
    const [externalSeason] = await dbOrTx
      .select()
      .from(externalSeasonsTable)
      .where(
        and(
          eq(externalSeasonsTable.dataSourceId, dataSourceId),
          eq(externalSeasonsTable.seasonId, seasonId),
        ),
      )
      .limit(1);
    return externalSeason ?? null;
  }

  async listExternalBySeasonIds(
    seasonIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSeason[]> {
    if (seasonIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(externalSeasonsTable)
      .where(inArray(externalSeasonsTable.seasonId, seasonIds));
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
