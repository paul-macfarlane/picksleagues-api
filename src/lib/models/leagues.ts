import { z } from "zod";
import { LEAGUE_TYPE_SLUGS } from "./leagueTypes";

export const pickEmLeagueSettingsSchema = z.object({
  picksPerPhase: z.number().min(1).max(16),
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
  name: z.string().min(MIN_LEAGUE_NAME_LENGTH).max(MAX_LEAGUE_NAME_LENGTH),
  image: z.union([z.string().url().optional(), z.literal(""), z.null()]),
  leagueTypeSlug: z.enum([LEAGUE_TYPE_SLUGS.PICK_EM]),
  startPhaseTemplateId: z.string().min(1).uuid(),
  endPhaseTemplateId: z.string().min(1).uuid(),
  visibility: z.enum([LEAGUE_VISIBILITIES.PRIVATE]),
  size: z.number().min(MIN_LEAGUE_SIZE).max(MAX_LEAGUE_SIZE),
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
