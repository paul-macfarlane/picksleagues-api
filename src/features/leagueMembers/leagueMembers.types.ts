import { leagueMembersTable } from "../../db/schema";
import { DBProfile } from "../profiles/profiles.types";

// Constants
export enum LEAGUE_MEMBER_ROLES {
  COMMISSIONER = "commissioner",
  MEMBER = "member",
}

// DB Types
export type DBLeagueMember = typeof leagueMembersTable.$inferSelect;

export type DBLeagueMemberInsert = typeof leagueMembersTable.$inferInsert;

export type DBLeagueMemberUpdate = Partial<DBLeagueMemberInsert>;

export type DBLeagueMemberWithProfile = DBLeagueMember & {
  profile: DBProfile;
};
