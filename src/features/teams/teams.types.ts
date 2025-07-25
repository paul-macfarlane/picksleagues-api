import { externalTeamsTable, teamsTable } from "../../db/schema.js";

export type DBTeam = typeof teamsTable.$inferSelect;
export type DBTeamInsert = typeof teamsTable.$inferInsert;
export type DBTeamUpdate = Partial<DBTeamInsert>;

export type DBExternalTeam = typeof externalTeamsTable.$inferSelect;
export type DBExternalTeamInsert = typeof externalTeamsTable.$inferInsert;
export type DBExternalTeamUpdate = Partial<DBExternalTeamInsert>;
