import { z } from "zod";
import { LEAGUE_TYPE_SLUGS } from "./leagueTypes";

export const MIN_PICKS_PER_PHASE = 1;
export const MAX_PICKS_PER_PHASE = 16;

export enum PICK_EM_PICK_TYPES {
  SPREAD = "spread",
  STRAIGHT_UP = "straight-up",
}

export const pickEmLeagueSettingsSchema = z.object({
  picksPerPhase: z
    .number()
    .min(MIN_PICKS_PER_PHASE, {
      message: `Picks per week must be at least ${MIN_PICKS_PER_PHASE}`,
    })
    .max(MAX_PICKS_PER_PHASE, {
      message: `Picks per week must be at most ${MAX_PICKS_PER_PHASE}`,
    }),
  pickType: z.enum([PICK_EM_PICK_TYPES.STRAIGHT_UP, PICK_EM_PICK_TYPES.SPREAD]),
});

export type PickEmLeagueSettings = z.infer<typeof pickEmLeagueSettingsSchema>;

const MIN_LEAGUE_NAME_LENGTH = 3;
const MAX_LEAGUE_NAME_LENGTH = 50;

const MIN_LEAGUE_SIZE = 2;
const MAX_LEAGUE_SIZE = 20;

export enum LEAGUE_VISIBILITIES {
  // PUBLIC = "public", will add public leagues later
  PRIVATE = "private",
}

export const createLeagueSchema = z.object({
  name: z
    .string()
    .min(MIN_LEAGUE_NAME_LENGTH, {
      message: `Name must be at least ${MIN_LEAGUE_NAME_LENGTH} characters`,
    })
    .max(MAX_LEAGUE_NAME_LENGTH, {
      message: `Name must be at most ${MAX_LEAGUE_NAME_LENGTH} characters`,
    })
    .trim(),
  image: z
    .union([z.string().url().optional(), z.literal(""), z.null()])
    .transform((val) => val?.trim() ?? null),
  leagueTypeSlug: z.enum([LEAGUE_TYPE_SLUGS.PICK_EM]),
  startPhaseTemplateId: z.string().min(1).uuid(),
  endPhaseTemplateId: z.string().min(1).uuid(),
  visibility: z.enum([LEAGUE_VISIBILITIES.PRIVATE]),
  size: z
    .number()
    .min(MIN_LEAGUE_SIZE, {
      message: `Size must be at least ${MIN_LEAGUE_SIZE}`,
    })
    .max(MAX_LEAGUE_SIZE, {
      message: `Size must be at most ${MAX_LEAGUE_SIZE}`,
    }),
});

export type CreateLeague = z.infer<typeof createLeagueSchema>;

export const createPickEmLeagueSchema = createLeagueSchema.extend({
  settings: pickEmLeagueSettingsSchema,
});

export type CreatePickEmLeague = z.infer<typeof createPickEmLeagueSchema>;

export enum LEAGUE_MEMBER_ROLES {
  COMMISSIONER = "commissioner",
  MEMBER = "member",
}
