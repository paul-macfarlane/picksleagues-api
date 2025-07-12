import { db } from "../../db";
import { profilesTable } from "../../db/schema";
import { DBProfile, DBProfileInsert, DBProfileUpdate } from "./profiles.types";
import { eq, or, like } from "drizzle-orm";

export async function searchProfiles(
  query: {
    username?: string;
    firstName?: string;
    lastName?: string;
  },
  limit: number = 10,
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

  const users = await db
    .select()
    .from(profilesTable)
    .where(or(...conditions))
    .limit(limit);

  return users;
}

export async function findByUserId(userId: string): Promise<DBProfile | null> {
  const profile = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  return profile[0] ?? null;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const result = await db
    .select({ userId: profilesTable.userId })
    .from(profilesTable)
    .where(eq(profilesTable.username, username))
    .limit(1);

  return !!result[0];
}

export async function update(
  userId: string,
  data: DBProfileUpdate,
): Promise<DBProfile> {
  const updated = await db
    .update(profilesTable)
    .set(data)
    .where(eq(profilesTable.userId, userId))
    .returning();

  return updated[0];
}

export async function create(data: DBProfileInsert): Promise<DBProfile> {
  const newProfile = await db.insert(profilesTable).values(data).returning();
  return newProfile[0];
}
