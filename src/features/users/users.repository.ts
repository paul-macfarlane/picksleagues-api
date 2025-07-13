import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db";
import { usersTable } from "../../db/schema";
import { DBUser } from "./users.types";

@injectable()
export class UsersRepository {
  async findById(id: string, dbOrTx: DBOrTx = db): Promise<DBUser | undefined> {
    const [user] = await dbOrTx
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    return user;
  }
}
