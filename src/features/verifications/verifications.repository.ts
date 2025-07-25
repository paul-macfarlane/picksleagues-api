import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import { verificationTable } from "../../db/schema.js";
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
