import { externalPhasesTable, phasesTable } from "../../db/schema.js";
import { z } from "zod";
import { PopulatedEvent } from "../events/events.types.js";
import { ESPN_SEASON_TYPES } from "../../integrations/espn/espn.types.js";
import { DBPhaseTemplate } from "../phaseTemplates/phaseTemplates.types.js";

// Constants

export enum PHASE_INCLUDES {
  PREVIOUS_PHASE = "previousPhase",
  NEXT_PHASE = "nextPhase",
  PHASE_TEMPLATE = "phaseTemplate",
  EVENTS = "events",
  EVENTS_LIVE_SCORES = "events.liveScores",
  EVENTS_OUTCOMES = "events.outcomes",
  EVENTS_ODDS = "events.odds",
  EVENTS_ODDS_SPORTSBOOK = "events.odds.sportsbook",
  EVENTS_HOME_TEAM = "events.homeTeam",
  EVENTS_AWAY_TEAM = "events.awayTeam",
}

// DB Types
export type DBPhase = typeof phasesTable.$inferSelect;
export type DBPhaseInsert = typeof phasesTable.$inferInsert;
export type DBPhaseUpdate = Partial<DBPhaseInsert>;

export type DBExternalPhase = typeof externalPhasesTable.$inferSelect;
export type DBExternalPhaseInsert = typeof externalPhasesTable.$inferInsert;
export type DBExternalPhaseUpdate = Partial<DBExternalPhaseInsert>;

export type PopulatedPhase = DBPhase & {
  previousPhase?: DBPhase;
  nextPhase?: DBPhase;
  phaseTemplate?: DBPhaseTemplate;
  events?: PopulatedEvent[];
};

// Validation Schemas

export const PhaseIdSchema = z.string().uuid();

export const PhaseIncludesSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(
        z.array(z.enum(Object.values(PHASE_INCLUDES) as [string, ...string[]])),
      )
      .optional(),
  })
  .optional();

export type CurrentPhaseInclude = z.infer<typeof PhaseIncludesSchema>;

export const EspnExternalPhaseMetadataSchema = z.object({
  number: z.number(),
  type: z.nativeEnum(ESPN_SEASON_TYPES),
});
