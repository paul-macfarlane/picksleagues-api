import { z } from "zod";
import { leaguesTable } from "../../db/schema";
import {
  LEAGUE_TYPE_SLUGS,
  DBLeagueType,
} from "../leagueTypes/leagueTypes.types";
import { DBLeagueMember } from "../leagueMembers/leagueMembers.types";

// Constants
export enum PICK_EM_PICK_TYPES {
  SPREAD = "spread",
  STRAIGHT_UP = "straight-up",
}

export enum LEAGUE_VISIBILITIES {
  // PUBLIC = "public", will add public leagues later
  PRIVATE = "private",
}

export const MIN_PICKS_PER_PHASE = 1;
export const MAX_PICKS_PER_PHASE = 16;
export const MIN_LEAGUE_NAME_LENGTH = 3;
export const MAX_LEAGUE_NAME_LENGTH = 50;
export const MIN_LEAGUE_SIZE = 2;
export const MAX_LEAGUE_SIZE = 20;

export enum LEAGUE_INCLUDES {
  IS_IN_SEASON = "is_in_season",
  LEAGUE_TYPE = "league_type",
  MEMBERS = "members",
}

// DB Types
export type DBLeague = typeof leaguesTable.$inferSelect;

export type DBLeagueWithLeagueType = DBLeague & {
  leagueType: DBLeagueType;
};

export type PopulatedDBLeague = DBLeague & {
  isInSeason?: boolean;
  leagueType?: DBLeagueType | null;
  members?: DBLeagueMember[];
};

export type DBLeagueInsert = typeof leaguesTable.$inferInsert;
export type DBLeagueUpdate = Partial<DBLeagueInsert>;

// Validation Schemas
export const LeagueIdSchema = z.string().trim().uuid();

export const LeagueIncludeSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(
        z.array(
          z.enum([
            LEAGUE_INCLUDES.LEAGUE_TYPE,
            LEAGUE_INCLUDES.MEMBERS,
            LEAGUE_INCLUDES.IS_IN_SEASON,
          ]),
        ),
      )
      .optional(),
  })
  .optional();

export const PickEmLeagueSettingsSchema = z.object({
  picksPerPhase: z
    .number()
    .int()
    .min(MIN_PICKS_PER_PHASE, {
      message: `Must be at least ${MIN_PICKS_PER_PHASE}`,
    })
    .max(MAX_PICKS_PER_PHASE, {
      message: `Must be at most ${MAX_PICKS_PER_PHASE}`,
    }),
  pickType: z.enum([PICK_EM_PICK_TYPES.STRAIGHT_UP, PICK_EM_PICK_TYPES.SPREAD]),
});

export const CreateLeagueSchema = z.object({
  name: z
    .string()
    .min(MIN_LEAGUE_NAME_LENGTH, {
      message: `Must be at least ${MIN_LEAGUE_NAME_LENGTH} characters`,
    })
    .max(MAX_LEAGUE_NAME_LENGTH, {
      message: `Must be at most ${MAX_LEAGUE_NAME_LENGTH} characters`,
    })
    .trim(),
  image: z
    .union([z.string().trim().url().optional(), z.literal(""), z.null()])
    .transform((val) => val?.trim() ?? null),
  leagueTypeSlug: z.enum([LEAGUE_TYPE_SLUGS.PICK_EM]),
  startPhaseTemplateId: z.string().trim().min(1).uuid(),
  endPhaseTemplateId: z.string().trim().min(1).uuid(),
  visibility: z.enum([LEAGUE_VISIBILITIES.PRIVATE]),
  size: z
    .number()
    .int()
    .min(MIN_LEAGUE_SIZE, {
      message: `Must be at least ${MIN_LEAGUE_SIZE}`,
    })
    .max(MAX_LEAGUE_SIZE, {
      message: `Size must be at most ${MAX_LEAGUE_SIZE}`,
    }),
  settings: PickEmLeagueSettingsSchema,
});
