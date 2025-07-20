import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { verificationTable } from "../../db/schema";
import { eq } from "drizzle-orm";

@injectable()
export class VerificationsRepository {
  async deleteByIdentifier(
    identifier: string,
    dbOrTx: DBOrTx = db,
  ): Promise<void> {
    await dbOrTx
      .delete(verificationTable)
      .where(eq(verificationTable.identifier, identifier));
  }
}
