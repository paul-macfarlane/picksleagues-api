import { SearchProfiles } from "../../lib/models/profiles";
import { profilesTable } from "../schema";
import { like, or } from "drizzle-orm";
import { db } from "../index";

export async function searchProfile(search: SearchProfiles) {
  if (!search.username && !search.firstName && !search.lastName) {
    return [];
  }

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
