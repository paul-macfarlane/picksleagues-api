import { leagueMembersTable } from "../../../db/schema";
import { DBProfile } from "../profiles/db";

export type DBLeagueMember = typeof leagueMembersTable.$inferSelect;

export type DBLeagueMemberInsert = typeof leagueMembersTable.$inferInsert;

export type DBLeagueMemberUpdate = Partial<DBLeagueMemberInsert>;

export type DBLeagueMemberWithProfile = DBLeagueMember & {
  profile: DBProfile;
};
