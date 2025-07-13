import { db, DBOrTx } from "../../db";
import { injectable, inject } from "inversify";
import { TYPES } from "../../lib/inversify.types";
import { SportLeaguesRepository } from "./sportLeagues.repository";
import { DBSportLeague } from "./sportLeagues.types";

@injectable()
export class SportLeaguesService {
  constructor(
    @inject(TYPES.SportLeaguesRepository)
    private sportLeaguesRepository: SportLeaguesRepository,
  ) {}

  async findById(
    id: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBSportLeague | null> {
    return await this.sportLeaguesRepository.findById(id, dbOrTx);
  }
}
