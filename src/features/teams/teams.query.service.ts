import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { TeamsRepository } from "./teams.repository";
import { DBExternalTeam, DBTeam } from "./teams.types";
import { DBOrTx } from "../../db";

@injectable()
export class TeamsQueryService {
  constructor(
    @inject(TYPES.TeamsRepository)
    private teamsRepository: TeamsRepository,
  ) {}

  async listBySportLeagueId(
    sportLeagueId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBTeam[]> {
    return this.teamsRepository.listBySportLeagueId(sportLeagueId, dbOrTx);
  }

  async findExternalByDataSourceIdAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalTeam | null> {
    return this.teamsRepository.findExternalByDataSourceIdAndExternalId(
      dataSourceId,
      externalId,
      dbOrTx,
    );
  }

  async listExternalByDataSourceIdAndTeamIds(
    dataSourceId: string,
    teamIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalTeam[]> {
    return this.teamsRepository.listExternalByDataSourceIdAndTeamIds(
      dataSourceId,
      teamIds,
      dbOrTx,
    );
  }
}
