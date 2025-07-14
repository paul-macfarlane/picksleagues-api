import { leagueInvitesTable } from "../../db/schema";
import { LEAGUE_MEMBER_ROLES } from "../leagueMembers/leagueMembers.types";
import { PopulatedDBLeague } from "../leagues/leagues.types";
import { z } from "zod";

// Constants

export enum LEAGUE_INVITE_TYPES {
  DIRECT = "direct",
  LINK = "link",
}

export enum LEAGUE_INVITE_STATUSES {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export const MIN_LEAGUE_INVITE_USES = 1;
export const MAX_LEAGUE_INVITE_USES = 10;

export const MIN_LEAGUE_INVITE_EXPIRATION_DAYS = 1;
export const MAX_LEAGUE_INVITE_EXPIRATION_DAYS = 30;

export enum LEAGUE_INVITE_INCLUDES {
  LEAGUE = "league",
  LEAGUE_TYPE = "league.leagueType",
}

// DB Types

export type DBLeagueInvite = typeof leagueInvitesTable.$inferSelect;

export type DBLeagueInviteInsert = typeof leagueInvitesTable.$inferInsert;

export type DBLeagueInviteUpdate = Partial<DBLeagueInviteInsert>;

export type PopulatedDBLeagueInvite = DBLeagueInvite & {
  league?: PopulatedDBLeague;
};

// Validation Schemas

export const LeagueInviteIdSchema = z.string().trim().uuid();

export const LeagueInviteTokenSchema = z.string().trim().uuid();
const allowedInviteIncludes = Object.values(LEAGUE_INVITE_INCLUDES) as [
  string,
  ...string[],
];

export const LeagueInviteIncludeSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(z.array(z.enum(allowedInviteIncludes)))
      .transform((includes) => {
        const includeSet = new Set(includes);
        if (includeSet.has("league.leagueType")) {
          includeSet.add("league");
        }
        return Array.from(
          includeSet,
        ) as (typeof allowedInviteIncludes)[number][];
      })
      .optional(),
  })
  .optional();

export const CreateLeagueInviteSchema = z
  .object({
    leagueId: z.string().trim().uuid(),
    role: z.enum([
      LEAGUE_MEMBER_ROLES.COMMISSIONER,
      LEAGUE_MEMBER_ROLES.MEMBER,
    ]),
    type: z.enum([LEAGUE_INVITE_TYPES.DIRECT, LEAGUE_INVITE_TYPES.LINK]),
    expiresInDays: z
      .number()
      .int()
      .min(MIN_LEAGUE_INVITE_EXPIRATION_DAYS, {
        message: `Expires in days must be at least ${MIN_LEAGUE_INVITE_EXPIRATION_DAYS}`,
      })
      .max(MAX_LEAGUE_INVITE_EXPIRATION_DAYS, {
        message: `Expires in days must be at most ${MAX_LEAGUE_INVITE_EXPIRATION_DAYS}`,
      }),

    // Direct invite only
    inviteeId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // if the invite type is direct, then inviteeId is required
    if (data.type === LEAGUE_INVITE_TYPES.DIRECT) {
      if (!data.inviteeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invitee ID is required for direct invites`,
          path: ["inviteeId"],
        });
      }
    }
    return true;
  });

export const RespondToLeagueInviteSchema = z.object({
  response: z.enum([
    LEAGUE_INVITE_STATUSES.ACCEPTED,
    LEAGUE_INVITE_STATUSES.DECLINED,
  ]),
});
