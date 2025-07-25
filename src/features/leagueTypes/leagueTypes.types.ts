import { leagueTypesTable } from "../../db/schema.js";
import { z } from "zod";

// Constants
export enum LEAGUE_TYPE_NAMES {
  PICK_EM = "Pick'Em",
}

export enum LEAGUE_TYPE_SLUGS {
  PICK_EM = "pick-em",
}

// DB Types
export type DBLeagueType = typeof leagueTypesTable.$inferSelect;

export type DBLeagueTypeInsert = typeof leagueTypesTable.$inferInsert;

export type DBLeagueTypeUpdate = Partial<DBLeagueTypeInsert>;

// Validation Schemas
export const LeagueTypeIdOrSlugSchema = z.string().trim();

export const LeagueTypeIdSchema = z.string().trim().uuid();
