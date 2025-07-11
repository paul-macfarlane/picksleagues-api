import { z } from "zod";
import {
  MAX_PICKS_PER_PHASE,
  MIN_PICKS_PER_PHASE,
  PICK_EM_PICK_TYPES,
  MIN_LEAGUE_NAME_LENGTH,
  MAX_LEAGUE_NAME_LENGTH,
  MIN_LEAGUE_SIZE,
  MAX_LEAGUE_SIZE,
  LEAGUE_VISIBILITIES,
} from "./constants";
import { LEAGUE_TYPE_SLUGS } from "../leagueTypes/constants";

export const PickEmLeagueSettingsSchema = z.object({
  picksPerPhase: z
    .number()
    .int()
    .min(MIN_PICKS_PER_PHASE, {
      message: `Picks per week must be at least ${MIN_PICKS_PER_PHASE}`,
    })
    .max(MAX_PICKS_PER_PHASE, {
      message: `Picks per week must be at most ${MAX_PICKS_PER_PHASE}`,
    }),
  pickType: z.enum([PICK_EM_PICK_TYPES.STRAIGHT_UP, PICK_EM_PICK_TYPES.SPREAD]),
});

export const CreateLeagueSchema = z.object({
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
      message: `Size must be at least ${MIN_LEAGUE_SIZE}`,
    })
    .max(MAX_LEAGUE_SIZE, {
      message: `Size must be at most ${MAX_LEAGUE_SIZE}`,
    }),
});
