import z from "zod";
import { picksTable } from "../../db/schema.js";
import { DBTeam } from "../teams/teams.types.js";
import { DBProfile } from "../profiles/profiles.types.js";
import { PopulatedEvent } from "../events/events.types.js";

// constants

export enum PICK_INCLUDES {
  PROFILE = "profile",
  TEAM = "team",
  EVENT = "event",
  EVENT_HOME_TEAM = "event.homeTeam",
  EVENT_AWAY_TEAM = "event.awayTeam",
  EVENT_LIVE_SCORE = "event.liveScore",
  EVENT_OUTCOME = "event.outcome",
  EVENT_ODDS = "event.odds",
  EVENT_ODDS_SPORTSBOOK = "event.odds.sportsbook",
}

// DB Types
export type DBPick = typeof picksTable.$inferSelect;
export type DBPickInsert = typeof picksTable.$inferInsert;
export type DBPickUpdate = Partial<DBPickInsert>;

export type PopulatedPick = DBPick & {
  profile?: DBProfile;
  team?: DBTeam;
  event?: PopulatedEvent;
};

// validaion

export const PickIdSchema = z.string().uuid();

export const PickIncludesSchema = z
  .object({
    include: z
      .string()
      .transform((val) => val.split(","))
      .pipe(
        z.array(z.enum(Object.values(PICK_INCLUDES) as [string, ...string[]])),
      )
      .optional(),
  })
  .optional();
