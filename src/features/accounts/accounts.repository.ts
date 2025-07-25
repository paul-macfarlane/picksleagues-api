import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { accountsTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";

@injectable()
export class AccountsRepository {
  async deleteByUserId(userId: string, dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx.delete(accountsTable).where(eq(accountsTable.userId, userId));
  }
}
