import z from "zod";
import {
  eventsTable,
  externalEventsTable,
  liveScoresTable,
  outcomesTable,
} from "../../db/schema.js";
import { ESPN_SPORT_LEAGUE_GAME_STATUSES } from "../../integrations/espn/espn.types.js";

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

export const espnStatusToLiveScoreStatus: Record<string, LIVE_SCORE_STATUSES> =
  {
    [ESPN_SPORT_LEAGUE_GAME_STATUSES.SCHEDULED]:
      LIVE_SCORE_STATUSES.NOT_STARTED,
    [ESPN_SPORT_LEAGUE_GAME_STATUSES.IN_PROGRESS]:
      LIVE_SCORE_STATUSES.IN_PROGRESS,
    [ESPN_SPORT_LEAGUE_GAME_STATUSES.FINAL]: LIVE_SCORE_STATUSES.FINAL,
  };

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
  awayTeamScoreRef: z.string().optional(),
  homeTeamScoreRef: z.string().optional(),
  statusRef: z.string().optional(),
});
