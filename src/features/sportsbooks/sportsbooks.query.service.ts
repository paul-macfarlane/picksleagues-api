import { injectable, inject } from "inversify";
import { SportsbooksRepository } from "./sportsbooks.repository.js";
import { DBOrTx } from "../../db/index.js";
import { DBExternalSportsbook, DBSportsbook } from "./sportsbooks.types.js";
import { TYPES } from "../../lib/inversify.types.js";

@injectable()
export class SportsbooksQueryService {
  constructor(
    @inject(TYPES.SportsbooksRepository)
    private sportsbooksRepository: SportsbooksRepository,
  ) {}

  async findDefault(dbOrTx?: DBOrTx): Promise<DBSportsbook | null> {
    return this.sportsbooksRepository.findDefault(dbOrTx);
  }

  async findExternalByDataSourceIdAndSportsbookId(
    dataSourceId: string,
    sportsbookId: string,
    dbOrTx?: DBOrTx,
  ): Promise<DBExternalSportsbook | null> {
    return this.sportsbooksRepository.findExternalByDataSourceIdAndSportsbookId(
      dataSourceId,
      sportsbookId,
      dbOrTx,
    );
  }
}
