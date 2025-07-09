import z from "zod";
import { LEAGUE_MEMBER_ROLES } from "./leagueMembers";

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

export const CREATE_LEAGUE_INVITE_SCHEMA = z
  .object({
    leagueId: z.string().uuid(),
    role: z.enum([
      LEAGUE_MEMBER_ROLES.COMMISSIONER,
      LEAGUE_MEMBER_ROLES.MEMBER,
    ]),
    inviteeId: z.string().optional(),
    maxUses: z
      .number()
      .int()
      .min(MIN_LEAGUE_INVITE_USES, {
        message: `Max uses must be at least ${MIN_LEAGUE_INVITE_USES}`,
      })
      .max(MAX_LEAGUE_INVITE_USES, {
        message: `Max uses must be at most ${MAX_LEAGUE_INVITE_USES}`,
      })
      .optional(),
    type: z.enum([LEAGUE_INVITE_TYPES.DIRECT, LEAGUE_INVITE_TYPES.LINK]),
    expiresInDays: z
      .number()
      .int()
      .min(MIN_LEAGUE_INVITE_EXPIRATION_DAYS, {
        message: `Expires in days must be at least ${MIN_LEAGUE_INVITE_EXPIRATION_DAYS}`,
      })
      .max(MAX_LEAGUE_INVITE_EXPIRATION_DAYS, {
        message: `Expires in days must be at most ${MAX_LEAGUE_INVITE_EXPIRATION_DAYS}`,
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // if the invite type is link, then maxUses is required
    if (data.type === LEAGUE_INVITE_TYPES.LINK) {
      if (data.maxUses === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Max uses is required for link invites`,
          path: ["maxUses"],
        });
      }
    }
    // if the invite type is direct, then inviteeId is required
    if (data.type === LEAGUE_INVITE_TYPES.DIRECT) {
      if (data.inviteeId === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invitee ID is required for direct invites`,
          path: ["inviteeId"],
        });
      }
    }
    return true;
  });

export const RESPOND_TO_LEAGUE_INVITE_SCHEMA = z.object({
  response: z.enum([
    LEAGUE_INVITE_STATUSES.ACCEPTED,
    LEAGUE_INVITE_STATUSES.DECLINED,
  ]),
});
