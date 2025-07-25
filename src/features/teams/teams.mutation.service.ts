import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types.js";
import { TeamsRepository } from "./teams.repository.js";
import { DBOrTx } from "../../db/index.js";
import {
  DBExternalTeam,
  DBExternalTeamInsert,
  DBExternalTeamUpdate,
  DBTeam,
  DBTeamInsert,
  DBTeamUpdate,
} from "./teams.types.js";

@injectable()
export class TeamsMutationService {
  constructor(
    @inject(TYPES.TeamsRepository)
    private teamsRepository: TeamsRepository,
  ) {}

  async create(team: DBTeamInsert, dbOrTx?: DBOrTx): Promise<DBTeam> {
    return this.teamsRepository.create(team, dbOrTx);
  }

  async update(
    id: string,
    team: DBTeamUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBTeam> {
    return this.teamsRepository.update(id, team, dbOrTx);
  }

  async createExternal(
    externalTeam: DBExternalTeamInsert,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalTeam> {
    return this.teamsRepository.createExternal(externalTeam, dbOrTx);
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    externalTeam: DBExternalTeamUpdate,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalTeam> {
    return this.teamsRepository.updateExternal(
      dataSourceId,
      externalId,
      externalTeam,
      dbOrTx,
    );
  }
}
