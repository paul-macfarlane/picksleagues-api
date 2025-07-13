import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { sportsLeaguesTable } from "../../db/schema";
import { DBSportLeague } from "./sportLeagues.types";

@injectable()
export class SportLeaguesRepository {
  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague | null> {
    const [sportLeague] = await dbOrTx
      .select()
      .from(sportsLeaguesTable)
      .where(eq(sportsLeaguesTable.id, id));
    return sportLeague ?? null;
  }
}
