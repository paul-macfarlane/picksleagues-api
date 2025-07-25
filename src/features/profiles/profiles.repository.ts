import { db, DBOrTx } from "../../db/index.js";
import { profilesTable } from "../../db/schema.js";
import { DBProfile, DBProfileInsert, DBProfileUpdate } from "./profiles.types.js";
import { eq, or, like, inArray } from "drizzle-orm";
import { injectable } from "inversify";

@injectable()
export class ProfilesRepository {
  async search(
    query: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
    limit: number = 10,
    dbOrTx: DBOrTx = db,
  ): Promise<DBProfile[]> {
    const conditions = [];
    if (query.username) {
      conditions.push(like(profilesTable.username, `%${query.username}%`));
    }
    if (query.firstName) {
      conditions.push(like(profilesTable.firstName, `%${query.firstName}%`));
    }
    if (query.lastName) {
      conditions.push(like(profilesTable.lastName, `%${query.lastName}%`));
    }

    const users = await dbOrTx
      .select()
      .from(profilesTable)
      .where(or(...conditions))
      .limit(limit);

    return users;
  }

  async listByUserIds(
    userIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBProfile[]> {
    if (userIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(profilesTable)
      .where(inArray(profilesTable.userId, userIds));
  }

  async findByUserId(
    userId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBProfile | null> {
    const profile = await dbOrTx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    return profile[0] ?? null;
  }

  async isUsernameTaken(
    username: string,
    dbOrTx: DBOrTx = db,
  ): Promise<boolean> {
    const result = await dbOrTx
      .select({ userId: profilesTable.userId })
      .from(profilesTable)
      .where(eq(profilesTable.username, username))
      .limit(1);

    return !!result[0];
  }

  async update(
    userId: string,
    data: DBProfileUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBProfile> {
    const updated = await dbOrTx
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.userId, userId))
      .returning();

    return updated[0];
  }

  async create(data: DBProfileInsert, dbOrTx: DBOrTx = db): Promise<DBProfile> {
    const newProfile = await dbOrTx
      .insert(profilesTable)
      .values(data)
      .returning();
    return newProfile[0];
  }
}
