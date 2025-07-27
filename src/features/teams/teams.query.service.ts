import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { TeamsRepository } from "./teams.repository.js";
import { DBExternalTeam, DBTeam } from "./teams.types.js";
import { DBOrTx } from "../../db/index.js";

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

  async listBySportLeagueIds(
    sportLeagueIds: string[],
    dbOrTx?: DBOrTx,
  ): Promise<DBTeam[]> {
    return this.teamsRepository.listBySportLeagueIds(sportLeagueIds, dbOrTx);
  }

  async findById(id: string, dbOrTx?: DBOrTx): Promise<DBTeam | null> {
    return this.teamsRepository.findById(id, dbOrTx);
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
