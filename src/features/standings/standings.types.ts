import z from "zod";
import { standingsTable } from "../../db/schema.js";
import { DBProfile } from "../profiles/profiles.types.js";

// constants

export enum STANDINGS_INCLUDES {
  PROFILE = "profile",
}

// DB Types
export type DBStandings = typeof standingsTable.$inferSelect;
export type DBStandingsInsert = typeof standingsTable.$inferInsert;
export type DBStandingsUpdate = Partial<DBStandingsInsert>;

export type PopulatedStandings = DBStandings & {
  profile?: DBProfile;
};

// Validation schemas
export const PickEmStandingsMetadataSchema = z.object({
  wins: z.number().min(0),
  losses: z.number().min(0),
  pushes: z.number().min(0),
});

export type PickEmStandingsMetadata = z.infer<
  typeof PickEmStandingsMetadataSchema
>;

export const StandingsIncludesSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(
        z.array(
          z.enum(Object.values(STANDINGS_INCLUDES) as [string, ...string[]]),
        ),
      )
      .optional(),
  })
  .optional();
