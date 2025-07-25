import { leagueMembersTable } from "../../db/schema.js";
import { DBProfile } from "../profiles/profiles.types.js";
import { z } from "zod";

// Constants
export enum LEAGUE_MEMBER_ROLES {
  COMMISSIONER = "commissioner",
  MEMBER = "member",
}

export enum LEAGUE_MEMBER_INCLUDES {
  PROFILE = "profile",
}

// DB Types
export type DBLeagueMember = typeof leagueMembersTable.$inferSelect;

export type DBLeagueMemberWithProfile = DBLeagueMember & {
  profile: DBProfile;
};

export type DBLeagueMemberInsert = typeof leagueMembersTable.$inferInsert;

export type DBLeagueMemberUpdate = Partial<DBLeagueMemberInsert>;

export type PopulatedDBLeagueMember = DBLeagueMember & {
  profile?: DBProfile;
};

// Validation Schemas

export const LeagueMemberIncludeSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(
        z.array(
          z.enum(
            Object.values(LEAGUE_MEMBER_INCLUDES) as [string, ...string[]],
          ),
        ),
      )
      .optional(),
  })
  .optional();

export const UpdateLeagueMemberSchema = z.object({
  role: z.enum([LEAGUE_MEMBER_ROLES.MEMBER, LEAGUE_MEMBER_ROLES.COMMISSIONER]),
});
