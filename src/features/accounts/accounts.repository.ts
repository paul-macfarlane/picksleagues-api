import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { accountsTable } from "../../db/schema";
import { eq } from "drizzle-orm";

@injectable()
export class AccountsRepository {
  async deleteByUserId(userId: string, dbOrTx: DBOrTx = db): Promise<void> {
    await dbOrTx.delete(accountsTable).where(eq(accountsTable.userId, userId));
  }
}
