import { profilesTable } from "../schema";
import { like, or } from "drizzle-orm";
import { db } from "../index";
import { DBProfile } from "../../lib/models/profiles/db";

export async function searchProfiles(search: {
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<DBProfile[]> {
  const whereClause = [
    search.username
      ? like(profilesTable.username, `%${search.username}%`)
      : undefined,
    search.firstName
      ? like(profilesTable.firstName, `%${search.firstName}%`)
      : undefined,
    search.lastName
      ? like(profilesTable.lastName, `%${search.lastName}%`)
      : undefined,
  ].filter(Boolean);

  const queryRows = await db
    .select()
    .from(profilesTable)
    .where(or(...whereClause))
    .limit(10);

  return queryRows;
}
