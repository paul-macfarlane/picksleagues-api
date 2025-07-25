import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { sessionsTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";

@injectable()
export class SessionsRepository {
  async deleteByUserId(userId: string, dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
  }
}
