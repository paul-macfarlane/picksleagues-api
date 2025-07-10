import z from "zod";
import { LEAGUE_MEMBER_ROLES } from "./leagueMembers";

export const LeagueInviteIdSchema = z.string().trim().uuid();

export const LeagueInviteTokenSchema = z.string().trim().uuid();

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
