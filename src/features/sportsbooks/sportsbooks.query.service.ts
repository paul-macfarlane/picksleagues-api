import { injectable, inject } from "inversify";
import { SportsbooksRepository } from "./sportsbooks.repository";
import { DBOrTx } from "../../db";
import { DBExternalSportsbook, DBSportsbook } from "./sportsbooks.types";
import { TYPES } from "../../lib/inversify.types";

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
