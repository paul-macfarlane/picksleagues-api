import z from "zod";
import {
  eventsTable,
  externalEventsTable,
  liveScoresTable,
  outcomesTable,
} from "../../db/schema";

// constants
export enum EVENT_TYPES {
  GAME = "game",
  //   MATCH = "match",
  //   TOURNAMENT = "tournament",
}

export enum LIVE_SCORE_STATUSES {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  FINAL = "final",
}

// database types
export type DBEvent = typeof eventsTable.$inferSelect;
export type DBEventInsert = typeof eventsTable.$inferInsert;
export type DBEventUpdate = Partial<DBEventInsert>;

export type DBExternalEvent = typeof externalEventsTable.$inferSelect;
export type DBExternalEventInsert = typeof externalEventsTable.$inferInsert;
export type DBExternalEventUpdate = Partial<DBExternalEventInsert>;

export type DBLiveScore = typeof liveScoresTable.$inferSelect;
export type DBLiveScoreInsert = typeof liveScoresTable.$inferInsert;
export type DBLiveScoreUpdate = Partial<DBLiveScoreInsert>;

export type DBOutcome = typeof outcomesTable.$inferSelect;
export type DBOutcomeInsert = typeof outcomesTable.$inferInsert;
export type DBOutcomeUpdate = Partial<DBOutcomeInsert>;

// validation types

export const EspnExternalEventMetadataSchema = z.object({
  oddsRef: z.string().optional(),
});
