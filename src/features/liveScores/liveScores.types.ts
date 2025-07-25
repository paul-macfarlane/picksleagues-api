import { liveScoresTable } from "../../db/schema";

export type DBLiveScore = typeof liveScoresTable.$inferSelect;
export type DBLiveScoreInsert = typeof liveScoresTable.$inferInsert;
export type DBLiveScoreUpdate = Partial<DBLiveScoreInsert>;
