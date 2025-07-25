import { injectable } from "inversify";
import { eq, and } from "drizzle-orm";
import { db, DBOrTx } from "../../db";
import { sportsbooksTable, externalSportsbooksTable } from "../../db/schema";
import {
  DBSportsbook,
  DBSportsbookInsert,
  DBExternalSportsbookInsert,
  DBExternalSportsbook,
} from "./sportsbooks.types";

@injectable()
export class SportsbooksRepository {
  async findDefault(dbOrTx: DBOrTx = db): Promise<DBSportsbook | null> {
    const sportsbooks = await dbOrTx
      .select({
        sportsbook: sportsbooksTable,
      })
      .from(sportsbooksTable)
      .innerJoin(
        externalSportsbooksTable,
        eq(sportsbooksTable.id, externalSportsbooksTable.sportsbookId),
      )
      .where(eq(sportsbooksTable.isDefault, true));
    return sportsbooks[0].sportsbook || null;
  }

  async create(values: DBSportsbookInsert, dbOrTx: DBOrTx = db) {
    const [sportsbook] = await dbOrTx
      .insert(sportsbooksTable)
      .values(values)
      .returning();
    return sportsbook;
  }

  async createExternal(
    values: DBExternalSportsbookInsert,
    dbOrTx: DBOrTx = db,
  ) {
    const [externalSportsbook] = await dbOrTx
      .insert(externalSportsbooksTable)
      .values(values)
      .returning();
    return externalSportsbook;
  }

  async findExternalByDataSourceIdAndSportsbookId(
    dataSourceId: string,
    sportsbookId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalSportsbook | null> {
    const [externalSportsbook] = await dbOrTx
      .select()
      .from(externalSportsbooksTable)
      .where(
        and(
          eq(externalSportsbooksTable.dataSourceId, dataSourceId),
          eq(externalSportsbooksTable.sportsbookId, sportsbookId),
        ),
      );
    return externalSportsbook || null;
  }
}
