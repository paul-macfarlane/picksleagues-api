import { leagueMembersTable } from "../../db/schema";
import { DBProfile } from "../profiles/profiles.types";
import { z } from "zod";

// Constants
export enum LEAGUE_MEMBER_ROLES {
  COMMISSIONER = "commissioner",
  MEMBER = "member",
}

export const LeagueMemberIncludeSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(z.array(z.enum(["profile"])))
      .optional(),
  })
  .optional();

// DB Types
export type DBLeagueMember = typeof leagueMembersTable.$inferSelect;

export type DBLeagueMemberInsert = typeof leagueMembersTable.$inferInsert;

export type DBLeagueMemberUpdate = Partial<DBLeagueMemberInsert>;

export type DBLeagueMemberWithProfile = DBLeagueMember & {
  profile: DBProfile;
};
