import { injectable } from "inversify";
import { eq } from "drizzle-orm";
import { db, DBOrTx } from "../../db";
import { usersTable } from "../../db/schema";
import { DBUser, DBUserUpdate } from "./users.types";

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

  async update(
    id: string,
    data: DBUserUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBUser> {
    const updated = await dbOrTx
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();

    return updated[0];
  }
}
