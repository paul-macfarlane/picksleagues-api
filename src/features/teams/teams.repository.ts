import { injectable } from "inversify";
import { DBOrTx, db } from "../../db/index.js";
import {
  DBExternalTeam,
  DBExternalTeamInsert,
  DBExternalTeamUpdate,
  DBTeam,
  DBTeamInsert,
  DBTeamUpdate,
} from "./teams.types.js";
import { externalTeamsTable, teamsTable } from "../../db/schema.js";
import { and, eq, inArray } from "drizzle-orm";

@injectable()
export class TeamsRepository {
  async create(team: DBTeamInsert, dbOrTx: DBOrTx = db): Promise<DBTeam> {
    const [newTeam] = await dbOrTx.insert(teamsTable).values(team).returning();
    return newTeam;
  }

  async update(
    id: string,
    team: DBTeamUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBTeam> {
    const [updatedTeam] = await dbOrTx
      .update(teamsTable)
      .set(team)
      .where(eq(teamsTable.id, id))
      .returning();
    return updatedTeam;
  }

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBTeam[]> {
    const teams = await dbOrTx
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.sportLeagueId, sportLeagueId));
    return teams;
  }

  async listBySportLeagueIds(
    sportLeagueIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBTeam[]> {
    if (sportLeagueIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(teamsTable)
      .where(inArray(teamsTable.sportLeagueId, sportLeagueIds));
  }

  async createExternal(
    externalTeam: DBExternalTeamInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalTeam> {
    const [newExternalTeam] = await dbOrTx
      .insert(externalTeamsTable)
      .values(externalTeam)
      .returning();

    return newExternalTeam;
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    externalTeam: DBExternalTeamUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalTeam> {
    const [updatedExternalTeam] = await dbOrTx
      .update(externalTeamsTable)
      .set(externalTeam)
      .where(
        and(
          eq(externalTeamsTable.dataSourceId, dataSourceId),
          eq(externalTeamsTable.externalId, externalId),
        ),
      )
      .returning();
    return updatedExternalTeam;
  }

  async findExternalByDataSourceIdAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalTeam | null> {
    const externalTeam = await dbOrTx
      .select()
      .from(externalTeamsTable)
      .where(
        and(
          eq(externalTeamsTable.dataSourceId, dataSourceId),
          eq(externalTeamsTable.externalId, externalId),
        ),
      );
    return externalTeam[0] || null;
  }

  async listExternalByDataSourceIdAndTeamIds(
    dataSourceId: string,
    teamIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalTeam[]> {
    const externalTeams = await dbOrTx
      .select()
      .from(externalTeamsTable)
      .where(
        and(
          eq(externalTeamsTable.dataSourceId, dataSourceId),
          inArray(externalTeamsTable.teamId, teamIds),
        ),
      );
    return externalTeams;
  }
}
