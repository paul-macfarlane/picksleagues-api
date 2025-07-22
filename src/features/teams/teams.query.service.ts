import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { TeamsRepository } from "./teams.repository";
import { DBExternalTeam } from "./teams.types";
import { DBOrTx } from "../../db";

@injectable()
export class TeamsQueryService {
  constructor(
    @inject(TYPES.TeamsRepository)
    private teamsRepository: TeamsRepository,
  ) {}

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
}
